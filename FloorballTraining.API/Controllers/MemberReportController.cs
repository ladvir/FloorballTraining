using System.Diagnostics;
using System.Security.Claims;
using FloorballTraining.API.Extensions;
using FloorballTraining.API.Services;
using FloorballTraining.API.Services.Ai;
using FloorballTraining.API.Services.Report;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Player report (Feat15 #48, etapa #73): aggregates the member's last 12 months —
/// test results with age/gender benchmarks, canadian scoring, attendance, individual
/// workouts — into strengths/weaknesses and a weighted quality score. Access is
/// Admin / ClubAdmin+HeadCoach of the member's club / a coach of a team the member
/// plays in, and every view is audit-logged (GDPR).
/// </summary>
[Authorize]
[Route("members/{memberId:int}/report")]
public class MemberReportController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    IAiCredentialResolver credentialResolver,
    IAiClientFactory aiClientFactory,
    IAiUsageLogger usageLogger,
    ILogger<MemberReportController> logger,
    IAuditService auditService,
    IPlayerPositionResolver positionResolver,
    IPlayerSkillCatalogService skillCatalogService) : BaseApiController
{
    private const int WindowMonths = 12;

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin");

    /// <summary>Admin; ClubAdmin/HeadCoach of the member's club; Coach of a member's team.</summary>
    private async Task<bool> CanViewReportAsync(Member member)
    {
        if (IsAdmin()) return true;

        var memberships = await clubRoleService.GetAllUserClubRolesAsync(CurrentUserId);
        var inClub = memberships.FirstOrDefault(m => m.ClubId == member.ClubId);
        if (inClub == null) return false;

        if (inClub.EffectiveRole is "ClubAdmin" or "HeadCoach") return true;
        if (inClub.EffectiveRole != "Coach") return false;

        var memberTeamIds = member.TeamMembers
            .Where(tm => tm.TeamId.HasValue)
            .Select(tm => tm.TeamId!.Value)
            .ToList();
        return inClub.CoachTeamIds.Any(memberTeamIds.Contains);
    }

    private Task<Member?> LoadMemberAsync(int memberId) => context.Members
        .Include(m => m.Club)
        .Include(m => m.TeamMembers).ThenInclude(tm => tm.Team)
        .FirstOrDefaultAsync(m => m.Id == memberId);

    [HttpGet]
    public async Task<ActionResult<PlayerReportDto>> GetReport(int memberId)
    {
        var member = await LoadMemberAsync(memberId);
        if (member == null) return NotFound();
        if (!await CanViewReportAsync(member)) return Forbid();

        var report = await BuildReportAsync(member);

        await auditService.LogAsync(AuditActions.MemberReportViewed, nameof(Member),
            memberId.ToString(), new { MemberName = $"{member.FirstName} {member.LastName}" });

        return report;
    }

    /// <summary>
    /// PDF export (QuestPDF). anonymized=true strips the name, birth year and contact
    /// for sharing outside the club; includeAi=true adds AI recommendations when a
    /// credential resolves (an AI failure degrades to a report without them). Every
    /// export is audit-logged with the anonymized flag (GDPR).
    /// </summary>
    [HttpGet("pdf")]
    public async Task<IActionResult> GetPdf(
        int memberId,
        [FromQuery] bool anonymized = false,
        [FromQuery] bool includeAi = false,
        CancellationToken cancellationToken = default)
    {
        var member = await LoadMemberAsync(memberId);
        if (member == null) return NotFound();
        if (!await CanViewReportAsync(member)) return Forbid();

        var report = await BuildReportAsync(member);

        List<AiRecommendationDto>? recommendations = null;
        if (includeAi)
            recommendations = await TryGenerateRecommendationsAsync(member, report, cancellationToken);

        var document = new FloorballTraining.Reporting.PlayerReportDocument(report, anonymized, recommendations);
        var pdfBytes = await Task.Run(() => document.GeneratePdfBytes(), cancellationToken);

        await auditService.LogAsync(AuditActions.MemberReportExported, nameof(Member),
            memberId.ToString(), new
            {
                MemberName = $"{member.FirstName} {member.LastName}",
                Anonymized = anonymized,
                IncludeAi = recommendations != null
            });

        var fileName = anonymized
            ? $"report-hrace-anonym-{memberId}.pdf"
            : $"report-{member.LastName}-{member.FirstName}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    /// <summary>Best-effort AI recommendations for the PDF — failures degrade silently.</summary>
    private async Task<List<AiRecommendationDto>?> TryGenerateRecommendationsAsync(
        Member member, PlayerReportDto report, CancellationToken cancellationToken)
    {
        var resolved = await credentialResolver.ResolveAsync(CurrentUserId, member.ClubId, cancellationToken);
        if (resolved.Error != null) return null;
        var credential = resolved.Credential!;

        var memberAgeGroupIds = member.TeamMembers
            .Where(tm => tm.Team != null)
            .Select(tm => tm.Team!.AgeGroupId)
            .Distinct()
            .ToList();
        var candidates = await RecommendationPromptBuilder.SelectCandidatesAsync(
            context, memberAgeGroupIds, cancellationToken);
        if (candidates.Count == 0) return null;

        var stopwatch = Stopwatch.StartNew();
        var inputTokens = 0;
        var outputTokens = 0;
        var success = false;
        string? errorType = null;
        try
        {
            var client = aiClientFactory.Create(credential.Provider, credential.ApiKey);
            var completion = await client.CompleteAsync(new AiChatRequest(
                RecommendationPromptBuilder.BuildSystemPrompt(),
                RecommendationPromptBuilder.BuildUserPrompt(report, candidates),
                credential.Model,
                MaxTokens: 4000), cancellationToken);
            inputTokens = completion.InputTokens;
            outputTokens = completion.OutputTokens;

            var (recommendations, _, error) =
                RecommendationPromptBuilder.ParseAndValidate(completion.Text, candidates);
            success = recommendations != null;
            errorType = error;
            return recommendations;
        }
        catch (AiProviderException ex)
        {
            errorType = ex.ErrorType;
            logger.LogWarning(ex, "AI provider error during PDF recommendations — exporting without them");
            return null;
        }
        finally
        {
            stopwatch.Stop();
            await usageLogger.LogAsync(new AiUsageEntry(
                CurrentUserId,
                member.ClubId,
                TeamId: member.TeamMembers.FirstOrDefault(tm => tm.TeamId.HasValue)?.TeamId,
                MemberId: member.Id,
                AiFeature.PlayerReport,
                credential.Provider,
                credential.Model,
                credential.CredentialId,
                credential.Source,
                inputTokens,
                outputTokens,
                (int)stopwatch.ElapsedMilliseconds,
                success,
                errorType));
        }
    }

    /// <summary>
    /// 3–5 AI development recommendations grounded in the report aggregation and the
    /// activity library (Feat15 #48). Uses the standard credential pipeline for the
    /// member's club; the prompt carries no personal identifiers. Non-streaming —
    /// the output is short.
    /// </summary>
    [HttpPost("recommendations")]
    [EnableRateLimiting(RateLimitingExtensions.AiPolicy)]
    public async Task<ActionResult<AiRecommendationsResultDto>> GetRecommendations(
        int memberId, CancellationToken cancellationToken)
    {
        var member = await LoadMemberAsync(memberId);
        if (member == null) return NotFound();
        if (!await CanViewReportAsync(member)) return Forbid();

        var resolved = await credentialResolver.ResolveAsync(CurrentUserId, member.ClubId, cancellationToken);
        switch (resolved.Error)
        {
            case AiResolutionError.AiDisabled:
                return StatusCode(StatusCodes.Status403Forbidden, new { code = "aiDisabled" });
            case AiResolutionError.NoCredential:
                return BadRequest(new { code = "noCredential" });
            case AiResolutionError.DecryptFailed:
                return BadRequest(new { code = "credentialNeedsReentry" });
        }
        var credential = resolved.Credential!;

        var report = await BuildReportAsync(member);
        var memberAgeGroupIds = member.TeamMembers
            .Where(tm => tm.Team != null)
            .Select(tm => tm.Team!.AgeGroupId)
            .Distinct()
            .ToList();
        var candidates = await RecommendationPromptBuilder.SelectCandidatesAsync(
            context, memberAgeGroupIds, cancellationToken);
        if (candidates.Count == 0)
            return BadRequest(new { code = "noActivities" });

        var chatRequest = new AiChatRequest(
            RecommendationPromptBuilder.BuildSystemPrompt(),
            RecommendationPromptBuilder.BuildUserPrompt(report, candidates),
            credential.Model,
            MaxTokens: 4000);

        var stopwatch = Stopwatch.StartNew();
        var inputTokens = 0;
        var outputTokens = 0;
        var success = false;
        string? errorType = null;

        try
        {
            var client = aiClientFactory.Create(credential.Provider, credential.ApiKey);
            var completion = await client.CompleteAsync(chatRequest, cancellationToken);
            inputTokens = completion.InputTokens;
            outputTokens = completion.OutputTokens;

            var (recommendations, warnings, error) =
                RecommendationPromptBuilder.ParseAndValidate(completion.Text, candidates);
            if (recommendations == null)
            {
                errorType = error ?? "parseFailed";
                return BadRequest(new { code = errorType });
            }

            success = true;
            return new AiRecommendationsResultDto
            {
                Recommendations = recommendations,
                Usage = new AiUsageDto { InputTokens = inputTokens, OutputTokens = outputTokens },
                Warnings = warnings,
            };
        }
        catch (AiProviderException ex)
        {
            errorType = ex.ErrorType;
            logger.LogWarning(ex, "AI provider error during report recommendations");
            return BadRequest(new { code = ex.ErrorType, message = ex.Message });
        }
        finally
        {
            stopwatch.Stop();
            await usageLogger.LogAsync(new AiUsageEntry(
                CurrentUserId,
                member.ClubId,
                TeamId: member.TeamMembers.FirstOrDefault(tm => tm.TeamId.HasValue)?.TeamId,
                MemberId: member.Id,
                AiFeature.PlayerReport,
                credential.Provider,
                credential.Model,
                credential.CredentialId,
                credential.Source,
                inputTokens,
                outputTokens,
                (int)stopwatch.ElapsedMilliseconds,
                success,
                errorType));
        }
    }

    // ── Aggregation ──────────────────────────────────────────────────────────

    internal async Task<PlayerReportDto> BuildReportAsync(Member member)
    {
        var now = DateTime.UtcNow;
        var windowStart = now.AddMonths(-WindowMonths);

        var memberAgeGroupIds = member.TeamMembers
            .Where(tm => tm.Team != null)
            .Select(tm => tm.Team!.AgeGroupId)
            .Distinct()
            .ToList();

        var tests = await BuildTestsAsync(member, memberAgeGroupIds, windowStart);
        var scoring = await BuildScoringAsync(member.Id, windowStart);
        var attendance = await BuildAttendanceAsync(member.Id, windowStart);
        var workouts = await BuildWorkoutsAsync(member.Id, windowStart);
        var gameStatsScore = await ComputeGameStatsPercentileAsync(member, scoring, windowStart);

        var skillPositions = await positionResolver.ResolveAsync(member.Id);
        var skillCategories = await skillCatalogService.BuildCategoriesAsync(member.Id, skillPositions);

        var strengths = tests
            .Where(t => t.LatestColour == "green" && t.Trend is null or >= 0)
            .Select(ToHighlight)
            .ToList();
        var weaknesses = tests
            .Where(t => t.LatestColour == "red"
                        || (t.Trend == -1 && t.LatestColour != "green" && t.LatestColour != null))
            .Select(ToHighlight)
            .ToList();

        var weights = await ResolveWeightsAsync(memberAgeGroupIds);
        var testColourScores = tests
            .Select(t => ReportMath.ColourToScore(t.LatestColour))
            .Where(s => s.HasValue)
            .Select(s => s!.Value)
            .ToList();
        var breakdown = new PlayerReportScoreBreakdownDto
        {
            TestsScore = testColourScores.Count > 0 ? Math.Round(testColourScores.Average(), 1) : null,
            AttendanceScore = attendance.Pct,
            WorkoutsScore = workouts.Pct,
            GameStatsScore = gameStatsScore,
            WeightTests = weights.WeightTests,
            WeightAttendance = weights.WeightAttendance,
            WeightWorkouts = weights.WeightWorkouts,
            WeightGameStats = weights.WeightGameStats,
        };

        return new PlayerReportDto
        {
            Member = await BuildMemberInfoAsync(member),
            Tests = tests,
            Scoring = scoring,
            Attendance = attendance,
            Workouts = workouts,
            Strengths = strengths,
            Weaknesses = weaknesses,
            ScoreBreakdown = breakdown,
            SkillCategories = skillCategories,
            QualityScore = ReportMath.WeightedScore(
                (breakdown.TestsScore, weights.WeightTests),
                (breakdown.AttendanceScore, weights.WeightAttendance),
                (breakdown.WorkoutsScore, weights.WeightWorkouts),
                (breakdown.GameStatsScore, weights.WeightGameStats)),
            GeneratedAt = now,
        };
    }

    private static PlayerReportHighlightDto ToHighlight(PlayerReportTestDto t) => new()
    {
        TestDefinitionId = t.TestDefinitionId,
        Name = t.Name,
        Colour = t.LatestColour,
        Trend = t.Trend,
        LatestValue = t.LatestValue,
        Unit = t.Unit,
        BenchmarkText = t.BenchmarkText,
    };

    private async Task<PlayerReportMemberDto> BuildMemberInfoAsync(Member member)
    {
        // Most frequent lineup slot as the position estimate — TeamMember carries
        // no position field (flagged to the PO in #48).
        var position = await context.LineupSlots
            .Where(s => s.Roster != null && s.Roster.MemberId == member.Id)
            .GroupBy(s => s.Position)
            .OrderByDescending(g => g.Count())
            .Select(g => (SlotPosition?)g.Key)
            .FirstOrDefaultAsync();

        return new PlayerReportMemberDto
        {
            Id = member.Id,
            FirstName = member.FirstName,
            LastName = member.LastName,
            BirthYear = member.BirthYear,
            Age = Math.Max(0, DateTime.UtcNow.Year - member.BirthYear),
            Gender = member.Gender.HasValue ? (int)member.Gender.Value : null,
            Email = member.Email,
            ClubName = member.Club?.Name ?? "",
            Teams = member.TeamMembers
                .Where(tm => tm.Team != null)
                .Select(tm => tm.Team!.Name)
                .Distinct()
                .ToList(),
            Position = position?.ToString(),
            MemberSince = member.CreatedAt == default ? null : member.CreatedAt,
        };
    }

    private async Task<List<PlayerReportTestDto>> BuildTestsAsync(
        Member member, List<int> memberAgeGroupIds, DateTime windowStart)
    {
        var results = await context.TestResults
            .Include(r => r.TestDefinition).ThenInclude(t => t!.ColourRanges)
            .Include(r => r.GradeOption)
            .Where(r => r.MemberId == member.Id && r.TestDate >= windowStart)
            .OrderBy(r => r.TestDate)
            .ToListAsync();

        return results
            .Where(r => r.TestDefinition != null)
            .GroupBy(r => r.TestDefinition!)
            .OrderBy(g => g.Key.SortOrder)
            .Select(group =>
            {
                var testDef = group.Key;
                var range = ReportMath.ResolveColourRange(testDef.ColourRanges, memberAgeGroupIds, member.Gender);

                var resultDtos = group.Select(r => new PlayerReportTestResultDto
                {
                    TestDate = r.TestDate,
                    NumericValue = r.NumericValue,
                    GradeLabel = r.GradeOption?.Label,
                    Colour = testDef.TestType == TestType.Grade
                        ? r.GradeOption?.Colour
                        : r.NumericValue.HasValue
                            ? ReportMath.ClassifyColour(range, r.NumericValue.Value)
                            : null,
                }).ToList();

                // Grade tests trend on the grade's numeric value (higher = better by convention).
                var chronologicalValues = testDef.TestType == TestType.Grade
                    ? group.Where(r => r.GradeOption != null).Select(r => (double)r.GradeOption!.NumericValue).ToList()
                    : group.Where(r => r.NumericValue.HasValue).Select(r => r.NumericValue!.Value).ToList();
                var higherIsBetter = testDef.TestType == TestType.Grade || testDef.HigherIsBetter;

                var latest = resultDtos.LastOrDefault();
                return new PlayerReportTestDto
                {
                    TestDefinitionId = testDef.Id,
                    Name = testDef.Name,
                    Unit = testDef.Unit,
                    HigherIsBetter = testDef.HigherIsBetter,
                    Category = (int)testDef.Category,
                    Results = resultDtos,
                    LatestValue = latest?.NumericValue,
                    LatestGradeLabel = latest?.GradeLabel,
                    LatestColour = latest?.Colour,
                    Trend = ReportMath.ComputeTrend(chronologicalValues, higherIsBetter),
                    BenchmarkText = ReportMath.FormatBenchmark(range, testDef.Unit),
                };
            })
            .ToList();
    }

    /// <summary>Member-scoped canadian scoring — same metric logic as KpiController.GetSummary.</summary>
    private async Task<PlayerReportScoringDto> BuildScoringAsync(int memberId, DateTime windowStart)
    {
        var entries = await context.StatTrackerEntries
            .Where(e => e.Kind == 0
                && e.Participant != null && e.Participant.MemberId == memberId
                && e.StatTracker != null && e.StatTracker.EventCategory == 0
                && e.CreatedAt >= windowStart
                && e.Metric != null
                && (e.Metric.Code == "goals" || e.Metric.Code == "assists"))
            .Select(e => new { e.StatTrackerId, Code = e.Metric!.Code, e.Delta })
            .ToListAsync();

        var goals = entries.Where(e => e.Code == "goals").Sum(e => e.Delta);
        var assists = entries.Where(e => e.Code == "assists").Sum(e => e.Delta);
        return new PlayerReportScoringDto
        {
            Goals = goals,
            Assists = assists,
            Points = goals + assists,
            Games = entries.Select(e => e.StatTrackerId).Distinct().Count(),
        };
    }

    private async Task<PlayerReportAttendanceDto> BuildAttendanceAsync(int memberId, DateTime windowStart)
    {
        var statuses = await context.AppointmentAttendances
            .Where(a => a.MemberId == memberId && a.RecordedAt >= windowStart && a.Status != 0)
            .Select(a => a.Status)
            .ToListAsync();

        var present = statuses.Count(s => s == 1);
        return new PlayerReportAttendanceDto
        {
            Present = present,
            Total = statuses.Count,
            Pct = statuses.Count > 0 ? Math.Round((double)present / statuses.Count * 100, 1) : null,
        };
    }

    private async Task<PlayerReportWorkoutsDto> BuildWorkoutsAsync(int memberId, DateTime windowStart)
    {
        var statuses = await context.IndividualWorkouts
            .Where(w => w.MemberId == memberId && w.AssignedAt >= windowStart)
            .Select(w => w.Status)
            .ToListAsync();

        var completed = statuses.Count(s => s == 1);
        return new PlayerReportWorkoutsDto
        {
            Assigned = statuses.Count,
            Completed = completed,
            Skipped = statuses.Count(s => s == 2),
            Pct = statuses.Count > 0 ? Math.Round((double)completed / statuses.Count * 100, 1) : null,
        };
    }

    /// <summary>Points-per-game percentile among the club's members with match entries.</summary>
    private async Task<double?> ComputeGameStatsPercentileAsync(
        Member member, PlayerReportScoringDto scoring, DateTime windowStart)
    {
        if (scoring.Games == 0) return null;

        var clubEntries = await context.StatTrackerEntries
            .Where(e => e.Kind == 0
                && e.Participant != null
                && e.StatTracker != null && e.StatTracker.EventCategory == 0
                && e.StatTracker.Team != null && e.StatTracker.Team.ClubId == member.ClubId
                && e.CreatedAt >= windowStart
                && e.Metric != null
                && (e.Metric.Code == "goals" || e.Metric.Code == "assists"))
            .Select(e => new { e.Participant!.MemberId, e.StatTrackerId, e.Delta })
            .ToListAsync();

        var pointsPerGame = clubEntries
            .GroupBy(e => e.MemberId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var games = g.Select(x => x.StatTrackerId).Distinct().Count();
                    return games > 0 ? (double)g.Sum(x => x.Delta) / games : 0;
                });

        if (!pointsPerGame.TryGetValue(member.Id, out var own)) return null;
        var peers = pointsPerGame.Where(kv => kv.Key != member.Id).Select(kv => kv.Value).ToList();
        // The only tracked player in the club sits mid-scale rather than at 100%.
        return peers.Count == 0 ? 50 : ReportMath.Percentile(own, peers);
    }

    private async Task<ReportScoreWeight> ResolveWeightsAsync(List<int> memberAgeGroupIds)
    {
        var stored = memberAgeGroupIds.Count == 0
            ? null
            : await context.ReportScoreWeights
                .FirstOrDefaultAsync(w => memberAgeGroupIds.Contains(w.AgeGroupId));
        return stored ?? new ReportScoreWeight();
    }
}
