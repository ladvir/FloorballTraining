using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Quantified season goals of a team (wins, test averages, attendance, manual targets, …).
/// Progress is computed on read from data that already exists — match stat trackers, test
/// results, appointments + attendance. The season verdict (successful / unsuccessful) is
/// derived from goal fulfilment, or set by hand via the <c>verdict</c> endpoint.
/// </summary>
[Authorize]
public class SeasonGoalsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService) : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsAdmin() => User.IsInRole("Admin");

    // ── Authorization (mirrors SeasonPlanController) ─────────────────────────

    private async Task<List<int>> GetAccessibleTeamIdsAsync()
    {
        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        if (roleInfo.EffectiveRole == "Admin")
            return await context.Teams.Select(t => t.Id).ToListAsync();

        if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach" && roleInfo.ClubId.HasValue)
            return await context.Teams
                .Where(t => t.ClubId == roleInfo.ClubId.Value)
                .Select(t => t.Id)
                .ToListAsync();

        if (roleInfo.EffectiveRole == "Coach")
        {
            if (roleInfo.CoachTeamIds.Count > 0)
                return roleInfo.CoachTeamIds;
            if (roleInfo.ClubId.HasValue)
                return await context.Teams
                    .Where(t => t.ClubId == roleInfo.ClubId.Value)
                    .Select(t => t.Id)
                    .ToListAsync();
            return [];
        }

        if (roleInfo.ClubId.HasValue)
        {
            var memberId = await context.Members
                .Where(m => m.AppUserId == userId && m.ClubId == roleInfo.ClubId.Value)
                .Select(m => (int?)m.Id)
                .FirstOrDefaultAsync();
            if (memberId == null) return [];

            return await context.TeamMembers
                .Where(tm => tm.MemberId == memberId.Value && tm.TeamId.HasValue)
                .Select(tm => tm.TeamId!.Value)
                .Distinct()
                .ToListAsync();
        }

        return [];
    }

    /// <summary>Write access: Admin, ClubAdmin/HeadCoach of the team's club, or coach of the team.</summary>
    private async Task<bool> CanManageAsync(int teamId)
    {
        if (IsAdmin()) return true;

        var teamClubId = await context.Teams
            .Where(t => t.Id == teamId)
            .Select(t => (int?)t.ClubId)
            .FirstOrDefaultAsync();
        if (teamClubId == null) return false;

        var myRoles = await clubRoleService.GetAllUserClubRolesAsync(GetCurrentUserId()!);
        var roleInClub = myRoles.FirstOrDefault(r => r.ClubId == teamClubId.Value);
        if (roleInClub == null) return false;

        if (roleInClub.EffectiveRole is "ClubAdmin" or "HeadCoach") return true;
        return roleInClub.EffectiveRole == "Coach" && roleInClub.CoachTeamIds.Contains(teamId);
    }

    /// <summary>Club-wide rollup is for club managers only (Admin / ClubAdmin / HeadCoach of that club).</summary>
    private async Task<bool> CanReadClubRollupAsync(int clubId)
    {
        if (IsAdmin()) return true;
        var myRoles = await clubRoleService.GetAllUserClubRolesAsync(GetCurrentUserId()!);
        var roleInClub = myRoles.FirstOrDefault(r => r.ClubId == clubId);
        return roleInClub?.EffectiveRole is "ClubAdmin" or "HeadCoach";
    }

    // ── Metric grouping ─────────────────────────────────────────────────────

    private static bool IsMatchMetric(SeasonGoalMetric m) => m is
        SeasonGoalMetric.Wins or SeasonGoalMetric.Losses or SeasonGoalMetric.Draws or
        SeasonGoalMetric.Points or SeasonGoalMetric.WinRatePercent or SeasonGoalMetric.GoalsFor or
        SeasonGoalMetric.GoalsAgainst or SeasonGoalMetric.GoalDifference;

    private static bool IsTestMetric(SeasonGoalMetric m) => m is
        SeasonGoalMetric.TestTeamAverage or SeasonGoalMetric.TestAverageImprovement or
        SeasonGoalMetric.TestImprovedSharePercent;

    private static bool IsProcessMetric(SeasonGoalMetric m) => m is
        SeasonGoalMetric.AttendanceRatePercent or SeasonGoalMetric.TrainingsCompleted;

    private static bool IsManualMetric(SeasonGoalMetric m) => m is
        SeasonGoalMetric.ManualDone or SeasonGoalMetric.ManualProgress;

    // ── Read: one team ──────────────────────────────────────────────────────

    /// <summary>GET /seasongoals/team/{teamId} — goals + live progress + verdict for the team's current season.</summary>
    [HttpGet("team/{teamId:int}")]
    public async Task<IActionResult> GetTeamGoals(int teamId)
    {
        var team = await context.Teams.Include(t => t.Season).FirstOrDefaultAsync(t => t.Id == teamId);
        if (team == null) return NotFound();

        var accessible = await GetAccessibleTeamIdsAsync();
        if (!accessible.Contains(teamId)) return Forbid();

        var canManage = await CanManageAsync(teamId);

        var dto = new TeamSeasonGoalsDto
        {
            TeamId = team.Id,
            TeamName = team.Name,
            SeasonId = team.SeasonId,
            SeasonName = team.Season?.Name,
            SeasonStart = team.Season?.StartDate,
            SeasonEnd = team.Season?.EndDate,
            CanManage = canManage,
        };

        if (team.SeasonId == null || team.Season == null)
        {
            dto.Verdict = SeasonVerdict.Pending;
            return Ok(dto);
        }

        var goals = await context.SeasonGoals
            .Include(g => g.TestDefinition)
            .Where(g => g.TeamId == teamId && g.SeasonId == team.SeasonId)
            .ToListAsync();

        var computed = await ComputeAsync(team, goals);
        FillDto(dto, computed);
        return Ok(dto);
    }

    // ── Read: month-by-month + season-total report ──────────────────────────

    private const int RankTakeCount = 7;

    private sealed record XpRow(int MemberId, int Points, DateTime When);
    private sealed record ScoringRow(int MemberId, string Code, int Delta, DateTime When);
    private sealed record AttendanceRow(int MemberId, int Status, DateTime When);
    private sealed record EarnRow(int MemberId, DateTime When);
    private sealed record BadgeEarnRow(int MemberId, BadgeCode Code, DateTime When);

    private static readonly Dictionary<BadgeCode, string> BadgeIcons =
        BadgeCatalog.All.ToDictionary(d => d.Code, d => d.Icon);

    /// <summary>
    /// GET /seasongoals/team/{teamId}/report — for each elapsed calendar month of the season, plus a
    /// season-total bucket: best players by XP (with career level) / scoring / attendance / badges /
    /// rewards.
    /// </summary>
    [HttpGet("team/{teamId:int}/report")]
    public async Task<IActionResult> GetTeamReport(int teamId)
    {
        var team = await context.Teams.Include(t => t.Season).FirstOrDefaultAsync(t => t.Id == teamId);
        if (team == null) return NotFound();

        var accessible = await GetAccessibleTeamIdsAsync();
        if (!accessible.Contains(teamId)) return Forbid();

        var dto = new TeamSeasonReportDto
        {
            TeamId = team.Id,
            TeamName = team.Name,
            SeasonId = team.SeasonId,
            SeasonName = team.Season?.Name,
            SeasonStart = team.Season?.StartDate,
            SeasonEnd = team.Season?.EndDate,
        };
        if (team.SeasonId == null || team.Season == null) return Ok(dto);

        var seasonStart = team.Season.StartDate.Date;
        var seasonEndExcl = team.Season.EndDate.Date.AddDays(1);
        var todayExcl = DateTime.Now.Date.AddDays(1);
        var reportEndExcl = seasonEndExcl < todayExcl ? seasonEndExcl : todayExcl;
        if (reportEndExcl <= seasonStart)
        {
            dto.SeasonTotal = new MonthlyTeamReportDto { Label = "season" };
            return Ok(dto);
        }

        // Active players of THIS team only — a team's coaches never count (even if they also play for
        // another team), and a player who's since been deactivated drops out, even if they still have
        // historical XP/stats/attendance rows.
        var rosterMemberIds = await context.TeamMembers
            .Where(tm => tm.TeamId == teamId && tm.IsPlayer && tm.Member!.IsActive)
            .Select(tm => tm.MemberId)
            .Distinct().ToListAsync();

        var names = (await context.Members
                .Where(m => rosterMemberIds.Contains(m.Id))
                .Select(m => new { m.Id, m.FirstName, m.LastName })
                .ToListAsync())
            .ToDictionary(m => m.Id, m => LeaderboardService.FormatName(m.FirstName, m.LastName));

        // Lifetime XP earned before the season started — the baseline for each month's career level
        // (XpProgression.Career runs on lifetime XP, not just XP earned within the season/month).
        var priorXpByMember = (await context.XpEvents.AsNoTracking()
                .Where(e => rosterMemberIds.Contains(e.MemberId) && e.OccurredAt < seasonStart)
                .GroupBy(e => e.MemberId)
                .Select(g => new { MemberId = g.Key, Points = g.Sum(x => x.Points) })
                .ToListAsync())
            .ToDictionary(x => x.MemberId, x => x.Points);

        var xpRaw = await context.XpEvents.AsNoTracking()
            .Where(e => rosterMemberIds.Contains(e.MemberId) && e.OccurredAt >= seasonStart && e.OccurredAt < reportEndExcl)
            .Select(e => new XpRow(e.MemberId, e.Points, e.OccurredAt))
            .ToListAsync();

        var scoringRaw = await context.StatTrackerEntries.AsNoTracking()
            .Where(e => e.Kind == 0 && e.Participant != null && e.StatTracker != null
                        && e.StatTracker.TeamId == teamId && e.StatTracker.EventCategory == 0
                        && rosterMemberIds.Contains(e.Participant!.MemberId)
                        && e.StatTracker.CreatedAt >= seasonStart && e.StatTracker.CreatedAt < reportEndExcl
                        && e.Metric != null && (e.Metric.Code == "goals" || e.Metric.Code == "assists"))
            .Select(e => new ScoringRow(e.Participant!.MemberId, e.Metric!.Code, e.Delta, e.StatTracker!.CreatedAt))
            .ToListAsync();

        // Attendance stats count trainings only — matches track participation via the lineup/
        // nomination, not attendance.
        var attendanceRaw = await context.AppointmentAttendances.AsNoTracking()
            .Where(a => a.Appointment != null && a.Appointment.TeamId == teamId
                        && a.Appointment.AppointmentType == AppointmentType.Training
                        && rosterMemberIds.Contains(a.MemberId)
                        && a.Appointment.Start >= seasonStart && a.Appointment.Start < reportEndExcl)
            .Select(a => new AttendanceRow(a.MemberId, a.Status, a.Appointment!.Start))
            .ToListAsync();

        var badgeRaw = await context.MemberBadges.AsNoTracking()
            .Where(b => rosterMemberIds.Contains(b.MemberId) && b.EarnedAt >= seasonStart && b.EarnedAt < reportEndExcl)
            .Select(b => new BadgeEarnRow(b.MemberId, b.Code, b.EarnedAt))
            .ToListAsync();

        var rewardRaw = await context.MemberRewardClaims.AsNoTracking()
            .Where(r => rosterMemberIds.Contains(r.MemberId) && r.EarnedAt >= seasonStart && r.EarnedAt < reportEndExcl)
            .Select(r => new EarnRow(r.MemberId, r.EarnedAt))
            .ToListAsync();

        var lastElapsedMonth = new DateTime(reportEndExcl.AddDays(-1).Year, reportEndExcl.AddDays(-1).Month, 1);
        for (var cursor = new DateTime(seasonStart.Year, seasonStart.Month, 1);
             cursor <= lastElapsedMonth;
             cursor = cursor.AddMonths(1))
        {
            var monthStart = cursor;
            var monthEndExcl = cursor.AddMonths(1);

            dto.Months.Add(new MonthlyTeamReportDto
            {
                Label = monthStart.ToString("yyyy-MM"),
                TopXp = RankXp(xpRaw, monthStart, monthEndExcl, priorXpByMember, names),
                TopScoring = RankScoring(scoringRaw.Where(x => x.When >= monthStart && x.When < monthEndExcl), names),
                TopAttendance = RankAttendance(attendanceRaw.Where(x => x.When >= monthStart && x.When < monthEndExcl), names),
                TopBadges = ListBadges(badgeRaw.Where(x => x.When >= monthStart && x.When < monthEndExcl), names),
                TopRewards = RankCount(rewardRaw.Where(x => x.When >= monthStart && x.When < monthEndExcl), names),
            });
        }

        dto.SeasonTotal = new MonthlyTeamReportDto
        {
            Label = "season",
            TopXp = RankXp(xpRaw, seasonStart, reportEndExcl, priorXpByMember, names),
            TopScoring = RankScoring(scoringRaw, names),
            TopAttendance = RankAttendance(attendanceRaw, names),
            TopBadges = ListBadges(badgeRaw, names),
            TopRewards = RankCount(rewardRaw, names),
        };

        return Ok(dto);
    }

    /// <summary>
    /// Ranks players by XP earned in [periodStart, periodEndExcl), and attaches each one's career
    /// level (rank name + index) as of the end of that period — lifetime XP, not just this period's.
    /// </summary>
    private static List<XpRankRowDto> RankXp(
        List<XpRow> allRows, DateTime periodStart, DateTime periodEndExcl,
        Dictionary<int, int> priorXpByMember, Dictionary<int, string> names)
    {
        var periodSums = allRows.Where(r => r.When >= periodStart && r.When < periodEndExcl)
            .GroupBy(r => r.MemberId).ToDictionary(g => g.Key, g => g.Sum(x => x.Points));
        var cumulativeSums = allRows.Where(r => r.When < periodEndExcl)
            .GroupBy(r => r.MemberId).ToDictionary(g => g.Key, g => g.Sum(x => x.Points));

        var ranked = periodSums.Where(kv => kv.Value != 0).OrderByDescending(kv => kv.Value).ToList();
        return TakeTopWithTies(ranked, kv => kv.Value, RankTakeCount)
            .Select(kv =>
            {
                var lifetime = priorXpByMember.GetValueOrDefault(kv.Key) + cumulativeSums.GetValueOrDefault(kv.Key);
                var career = XpProgression.Career(lifetime);
                return new XpRankRowDto
                {
                    MemberId = kv.Key,
                    Name = names.GetValueOrDefault(kv.Key, "?"),
                    Value = kv.Value,
                    LevelIndex = career.RankIndex,
                    LevelName = career.Rank,
                };
            })
            .ToList();
    }

    /// <summary>Top N by descending value, plus any further rows tied with the Nth value (ties are never cut off).</summary>
    private static List<T> TakeTopWithTies<T>(List<T> sortedDesc, Func<T, double> value, int n)
    {
        if (sortedDesc.Count <= n) return sortedDesc;
        var cutoff = value(sortedDesc[n - 1]);
        return sortedDesc.TakeWhile(x => value(x) >= cutoff).ToList();
    }

    private static List<PlayerRankRowDto> RankCount(IEnumerable<EarnRow> rows, Dictionary<int, string> names)
    {
        var ranked = rows.GroupBy(r => r.MemberId)
            .Select(g => new PlayerRankRowDto { MemberId = g.Key, Name = names.GetValueOrDefault(g.Key, "?"), Value = g.Count() })
            .OrderByDescending(r => r.Value)
            .ToList();
        return TakeTopWithTies(ranked, r => r.Value, RankTakeCount);
    }

    /// <summary>Most recently earned badges first (a member earns each badge code at most once per season).</summary>
    private static List<BadgeEarnRowDto> ListBadges(IEnumerable<BadgeEarnRow> rows, Dictionary<int, string> names) =>
        rows.OrderByDescending(r => r.When)
            .Take(RankTakeCount)
            .Select(r => new BadgeEarnRowDto
            {
                MemberId = r.MemberId,
                Name = names.GetValueOrDefault(r.MemberId, "?"),
                Code = r.Code.ToString(),
                Icon = BadgeIcons.GetValueOrDefault(r.Code, string.Empty),
            })
            .ToList();

    /// <summary>A goal counts for more than an assist in the scoring ranking.</summary>
    private const int GoalWeight = 2;
    private const int AssistWeight = 1;

    private static List<PlayerRankRowDto> RankScoring(IEnumerable<ScoringRow> rows, Dictionary<int, string> names)
    {
        var ranked = rows.GroupBy(r => r.MemberId)
            .Select(g => new PlayerRankRowDto
            {
                MemberId = g.Key,
                Name = names.GetValueOrDefault(g.Key, "?"),
                Value = g.Where(x => x.Code == "goals").Sum(x => x.Delta) * GoalWeight
                        + g.Where(x => x.Code == "assists").Sum(x => x.Delta) * AssistWeight,
            })
            .Where(r => r.Value != 0)
            .OrderByDescending(r => r.Value)
            .ToList();
        return TakeTopWithTies(ranked, r => r.Value, RankTakeCount);
    }

    private static List<PlayerRankRowDto> RankAttendance(IEnumerable<AttendanceRow> rows, Dictionary<int, string> names)
    {
        var ranked = rows.GroupBy(r => r.MemberId)
            .Select(g => new { MemberId = g.Key, Total = g.Count(), Present = g.Count(x => x.Status == 1) })
            .Where(x => x.Total > 0)
            .Select(x => new PlayerRankRowDto
            {
                MemberId = x.MemberId,
                Name = names.GetValueOrDefault(x.MemberId, "?"),
                Value = Math.Round(100.0 * x.Present / x.Total, 1),
            })
            .OrderByDescending(r => r.Value)
            .ToList();
        return TakeTopWithTies(ranked, r => r.Value, RankTakeCount);
    }

    // ── Read: club rollup ──────────────────────────────────────────────────

    /// <summary>GET /seasongoals/club/{clubId}?seasonId= — one row per team of that season.</summary>
    [HttpGet("club/{clubId:int}")]
    public async Task<IActionResult> GetClubRollup(int clubId, [FromQuery] int seasonId)
    {
        if (!await CanReadClubRollupAsync(clubId)) return Forbid();
        if (seasonId <= 0) return BadRequest(new { message = "seasonId je povinný." });

        var teams = await context.Teams
            .Include(t => t.Season)
            .Where(t => t.ClubId == clubId && t.SeasonId == seasonId)
            .OrderBy(t => t.Name)
            .ToListAsync();

        var teamIds = teams.Select(t => t.Id).ToList();
        var goalsByTeam = (await context.SeasonGoals
                .Include(g => g.TestDefinition)
                .Where(g => teamIds.Contains(g.TeamId) && g.SeasonId == seasonId)
                .ToListAsync())
            .GroupBy(g => g.TeamId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var rows = new List<ClubSeasonGoalRowDto>();
        foreach (var team in teams)
        {
            var goals = goalsByTeam.GetValueOrDefault(team.Id, []);
            var c = await ComputeAsync(team, goals);
            rows.Add(new ClubSeasonGoalRowDto
            {
                TeamId = team.Id,
                TeamName = team.Name,
                AchievedCount = c.AchievedCount,
                TotalCount = c.TotalCount,
                Verdict = c.Verdict,
                VerdictOverridden = c.VerdictOverridden,
            });
        }

        return Ok(rows);
    }

    // ── Write: goal CRUD ───────────────────────────────────────────────────

    /// <summary>POST /seasongoals</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SeasonGoalInputDto dto)
    {
        if (!await CanManageAsync(dto.TeamId)) return Forbid();

        var error = await ValidateAsync(dto);
        if (error != null) return BadRequest(new { message = error });

        Normalize(dto);
        var goal = new SeasonGoal
        {
            SeasonId = dto.SeasonId,
            TeamId = dto.TeamId,
            Metric = dto.Metric,
            TestDefinitionId = dto.TestDefinitionId,
            Direction = dto.Direction,
            Target = dto.Target,
            ManualValue = dto.ManualValue,
            Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim(),
            CreatedByUserId = GetCurrentUserId(),
        };
        context.SeasonGoals.Add(goal);
        await context.SaveChangesAsync();

        return Ok(await LoadOneAsync(goal.Id));
    }

    /// <summary>PUT /seasongoals/{id}</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SeasonGoalInputDto dto)
    {
        var goal = await context.SeasonGoals.FirstOrDefaultAsync(g => g.Id == id);
        if (goal == null) return NotFound();
        if (goal.Metric == SeasonGoalMetric.OutcomeOverride)
            return BadRequest(new { message = "Verdikt sezóny se mění přes /verdict." });
        if (!await CanManageAsync(goal.TeamId)) return Forbid();

        dto.SeasonId = goal.SeasonId; // fixed
        dto.TeamId = goal.TeamId;
        var error = await ValidateAsync(dto);
        if (error != null) return BadRequest(new { message = error });

        Normalize(dto);
        goal.Metric = dto.Metric;
        goal.TestDefinitionId = dto.TestDefinitionId;
        goal.Direction = dto.Direction;
        goal.Target = dto.Target;
        goal.ManualValue = dto.ManualValue;
        goal.Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim();
        goal.UpdatedAt = DateTime.UtcNow;
        goal.UpdatedByUserId = GetCurrentUserId();
        await context.SaveChangesAsync();

        return Ok(await LoadOneAsync(id));
    }

    /// <summary>DELETE /seasongoals/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var goal = await context.SeasonGoals.FirstOrDefaultAsync(g => g.Id == id);
        if (goal == null) return NotFound();
        if (!await CanManageAsync(goal.TeamId)) return Forbid();

        context.SeasonGoals.Remove(goal);
        await context.SaveChangesAsync();
        return NoContent();
    }

    // ── Write: season verdict override ─────────────────────────────────────

    public class VerdictRequest
    {
        public int SeasonId { get; set; }
        /// <summary>true = successful, false = unsuccessful, null = clear the override (back to derived).</summary>
        public bool? Successful { get; set; }
        public string? Note { get; set; }
    }

    /// <summary>PUT /seasongoals/team/{teamId}/verdict — set or clear the coach's manual season verdict.</summary>
    [HttpPut("team/{teamId:int}/verdict")]
    public async Task<IActionResult> SetVerdict(int teamId, [FromBody] VerdictRequest dto)
    {
        if (!await CanManageAsync(teamId)) return Forbid();
        if (dto.SeasonId <= 0) return BadRequest(new { message = "seasonId je povinný." });

        var row = await context.SeasonGoals.FirstOrDefaultAsync(g =>
            g.TeamId == teamId && g.SeasonId == dto.SeasonId &&
            g.Metric == SeasonGoalMetric.OutcomeOverride);

        if (dto.Successful == null)
        {
            if (row != null)
            {
                context.SeasonGoals.Remove(row);
                await context.SaveChangesAsync();
            }
            return NoContent();
        }

        if (row == null)
        {
            row = new SeasonGoal
            {
                SeasonId = dto.SeasonId,
                TeamId = teamId,
                Metric = SeasonGoalMetric.OutcomeOverride,
                Direction = SeasonGoalDirection.AtLeast,
                Target = 1,
                CreatedByUserId = GetCurrentUserId(),
            };
            context.SeasonGoals.Add(row);
        }

        row.ManualValue = dto.Successful.Value ? 1 : 0;
        row.Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim();
        row.UpdatedAt = DateTime.UtcNow;
        row.UpdatedByUserId = GetCurrentUserId();
        await context.SaveChangesAsync();
        return NoContent();
    }

    // ── Validation ─────────────────────────────────────────────────────────

    private async Task<string?> ValidateAsync(SeasonGoalInputDto dto)
    {
        if (dto.Metric == SeasonGoalMetric.OutcomeOverride)
            return "Verdikt sezóny se nastavuje přes /verdict.";
        if (!Enum.IsDefined(dto.Metric))
            return "Neznámá metrika.";
        if (!double.IsFinite(dto.Target))
            return "Cílová hodnota není platné číslo.";

        if (!await context.Seasons.AnyAsync(s => s.Id == dto.SeasonId))
            return "Sezóna neexistuje.";
        if (!await context.Teams.AnyAsync(t => t.Id == dto.TeamId))
            return "Tým neexistuje.";

        if (IsTestMetric(dto.Metric))
        {
            if (dto.TestDefinitionId == null)
                return "U testového cíle vyberte test.";
            if (!await context.TestDefinitions.AnyAsync(d => d.Id == dto.TestDefinitionId.Value))
                return "Vybraný test neexistuje.";
        }

        if (dto.Metric == SeasonGoalMetric.ManualProgress && dto.Target <= 0)
            return "U ručního cíle s progresem zadejte cílové N větší než 0.";

        // A manual goal has no metric of its own — its Note is the name that tells it apart.
        if (IsManualMetric(dto.Metric) && string.IsNullOrWhiteSpace(dto.Note))
            return "U ručního cíle zadejte název.";

        return null;
    }

    private static void Normalize(SeasonGoalInputDto dto)
    {
        if (!IsTestMetric(dto.Metric)) dto.TestDefinitionId = null;

        switch (dto.Metric)
        {
            case SeasonGoalMetric.Losses:
            case SeasonGoalMetric.GoalsAgainst:
                // "at most" is the only sensible reading
                dto.Direction = SeasonGoalDirection.AtMost;
                break;
            case SeasonGoalMetric.ManualDone:
                dto.Direction = SeasonGoalDirection.AtLeast;
                dto.Target = 1;
                break;
        }
    }

    // ── Progress computation ───────────────────────────────────────────────

    private sealed record Computed(
        List<SeasonGoalDto> Goals, int AchievedCount, int TotalCount,
        SeasonVerdict Verdict, bool VerdictOverridden, string? OverrideNote);

    private static void FillDto(TeamSeasonGoalsDto dto, Computed c)
    {
        dto.Goals = c.Goals;
        dto.AchievedCount = c.AchievedCount;
        dto.TotalCount = c.TotalCount;
        dto.Verdict = c.Verdict;
        dto.VerdictOverridden = c.VerdictOverridden;
        dto.OverrideNote = c.OverrideNote;
    }

    private async Task<Computed> ComputeAsync(Team team, List<SeasonGoal> goals)
    {
        var seasonStart = team.Season!.StartDate.Date;
        var seasonEnd = team.Season.EndDate.Date;
        var seasonEndExcl = seasonEnd.AddDays(1);
        var seasonId = team.SeasonId!.Value;

        var tracked = goals.Where(g => g.Metric != SeasonGoalMetric.OutcomeOverride).ToList();

        var matchBundle = tracked.Any(g => IsMatchMetric(g.Metric))
            ? await LoadMatchBundleAsync(team.Id, seasonId) : null;
        var processBundle = tracked.Any(g => IsProcessMetric(g.Metric))
            ? await LoadProcessBundleAsync(team.Id, seasonStart, seasonEndExcl) : null;

        var testBundles = new Dictionary<int, TestBundle>();
        var testDefIds = tracked
            .Where(g => IsTestMetric(g.Metric) && g.TestDefinitionId.HasValue)
            .Select(g => g.TestDefinitionId!.Value).Distinct().ToList();
        if (testDefIds.Count > 0)
            testBundles = await LoadTestBundlesAsync(team.Id, testDefIds, seasonStart, seasonEndExcl);

        var goalDtos = new List<SeasonGoalDto>();
        foreach (var g in tracked)
        {
            double? current = g.Metric switch
            {
                SeasonGoalMetric.Wins => matchBundle?.Wins,
                SeasonGoalMetric.Losses => matchBundle?.Losses,
                SeasonGoalMetric.Draws => matchBundle?.Draws,
                SeasonGoalMetric.Points => matchBundle is null ? null : 3 * matchBundle.Wins + matchBundle.Draws,
                SeasonGoalMetric.WinRatePercent => matchBundle is { Played: > 0 }
                    ? 100.0 * matchBundle.Wins / matchBundle.Played : null,
                SeasonGoalMetric.GoalsFor => matchBundle?.GoalsFor,
                SeasonGoalMetric.GoalsAgainst => matchBundle?.GoalsAgainst,
                SeasonGoalMetric.GoalDifference => matchBundle is null ? null : matchBundle.GoalsFor - matchBundle.GoalsAgainst,
                SeasonGoalMetric.AttendanceRatePercent => processBundle?.AttendanceRatePercent,
                SeasonGoalMetric.TrainingsCompleted => processBundle?.TrainingsCompleted,
                SeasonGoalMetric.TestTeamAverage => Test(g)?.CurrentAvg,
                SeasonGoalMetric.TestAverageImprovement => Test(g)?.AvgImprovement,
                SeasonGoalMetric.TestImprovedSharePercent => Test(g)?.ImprovedSharePercent,
                SeasonGoalMetric.ManualDone => g.ManualValue ?? 0,
                SeasonGoalMetric.ManualProgress => g.ManualValue ?? 0,
                _ => null,
            };

            var (achieved, pct) = Evaluate(g.Direction, g.Target, current);
            goalDtos.Add(new SeasonGoalDto
            {
                Id = g.Id,
                SeasonId = g.SeasonId,
                TeamId = g.TeamId,
                Metric = g.Metric,
                TestDefinitionId = g.TestDefinitionId,
                TestName = g.TestDefinition?.Name,
                TestUnit = g.TestDefinition?.Unit,
                Direction = g.Direction,
                Target = g.Target,
                ManualValue = g.ManualValue,
                Note = g.Note,
                CurrentValue = current is null ? null : Math.Round(current.Value, 2),
                Achieved = achieved,
                ProgressPercent = pct,
            });

            TestBundle? Test(SeasonGoal goal) =>
                goal.TestDefinitionId.HasValue ? testBundles.GetValueOrDefault(goal.TestDefinitionId.Value) : null;
        }

        var achievedCount = goalDtos.Count(x => x.Achieved);
        var totalCount = goalDtos.Count;

        var overrideRow = goals.FirstOrDefault(g => g.Metric == SeasonGoalMetric.OutcomeOverride);
        SeasonVerdict verdict;
        bool overridden = false;
        string? overrideNote = null;

        if (overrideRow != null)
        {
            verdict = (overrideRow.ManualValue ?? 0) >= 1 ? SeasonVerdict.Successful : SeasonVerdict.Unsuccessful;
            overridden = true;
            overrideNote = overrideRow.Note;
        }
        else if (totalCount == 0)
        {
            verdict = SeasonVerdict.Pending;
        }
        else if (achievedCount == totalCount)
        {
            verdict = SeasonVerdict.Successful;
        }
        else if (DateTime.Now.Date > seasonEnd)
        {
            verdict = achievedCount * 2 >= totalCount ? SeasonVerdict.Partial : SeasonVerdict.Unsuccessful;
        }
        else
        {
            verdict = SeasonVerdict.Pending;
        }

        return new Computed(goalDtos, achievedCount, totalCount, verdict, overridden, overrideNote);
    }

    private static (bool achieved, double progressPercent) Evaluate(
        SeasonGoalDirection dir, double target, double? current)
    {
        if (current is null) return (false, 0);
        var c = current.Value;

        if (dir == SeasonGoalDirection.AtLeast)
        {
            if (target <= 0) return (c >= target, c >= target ? 100 : 0);
            return (c >= target, Math.Round(Math.Clamp(100.0 * c / target, 0, 100), 1));
        }

        // AtMost: at or below the target is done; further above = worse
        if (c <= target) return (true, 100);
        if (c <= 0) return (false, 0);
        return (false, Math.Round(Math.Clamp(100.0 * target / c, 0, 100), 1));
    }

    // ── Bundles ────────────────────────────────────────────────────────────

    private sealed class MatchBundle
    {
        public int Wins, Losses, Draws, GoalsFor, GoalsAgainst, Played;
    }

    // ponytail: assumes the tracked team is the "home" side (Kind 1). Add a StatTracker.IsHome
    // flag if coaches start tracking away games with the sides reversed.
    private async Task<MatchBundle> LoadMatchBundleAsync(int teamId, int seasonId)
    {
        var trackerIds = await context.StatTrackers
            .Where(s => s.TeamId == teamId && s.EventCategory == 0 && s.SeasonId == seasonId
                        && s.Participants.Any())
            .Select(s => s.Id)
            .ToListAsync();

        var bundle = new MatchBundle { Played = trackerIds.Count };
        if (trackerIds.Count == 0) return bundle;

        var entries = await context.StatTrackerEntries
            .Where(e => trackerIds.Contains(e.StatTrackerId) && (e.Kind == 1 || e.Kind == 2))
            .Select(e => new { e.StatTrackerId, e.Kind, e.Delta })
            .ToListAsync();

        foreach (var tid in trackerIds)
        {
            var home = entries.Where(e => e.StatTrackerId == tid && e.Kind == 1).Sum(e => e.Delta);
            var away = entries.Where(e => e.StatTrackerId == tid && e.Kind == 2).Sum(e => e.Delta);
            bundle.GoalsFor += home;
            bundle.GoalsAgainst += away;
            if (home > away) bundle.Wins++;
            else if (home < away) bundle.Losses++;
            else bundle.Draws++;
        }

        return bundle;
    }

    private sealed class ProcessBundle
    {
        public double? AttendanceRatePercent;
        public int TrainingsCompleted;
    }

    private async Task<ProcessBundle> LoadProcessBundleAsync(int teamId, DateTime from, DateTime toExcl)
    {
        var appts = await context.Appointments
            .Where(a => a.TeamId == teamId && a.Start >= from && a.Start < toExcl)
            .Select(a => new { a.Id, a.AppointmentType, a.End })
            .ToListAsync();

        var now = DateTime.Now;
        var bundle = new ProcessBundle
        {
            TrainingsCompleted = appts.Count(a =>
                a.AppointmentType == AppointmentType.Training && a.End <= now),
        };

        // Attendance rate counts trainings only — matches track participation via the lineup/
        // nomination, not attendance.
        var apptIds = appts
            .Where(a => a.AppointmentType == AppointmentType.Training)
            .Select(a => a.Id)
            .ToList();
        if (apptIds.Count > 0)
        {
            var statuses = await context.AppointmentAttendances
                .Where(x => apptIds.Contains(x.AppointmentId))
                .Select(x => x.Status)
                .ToListAsync();
            var present = statuses.Count(s => s == 1);
            var denom = present + statuses.Count(s => s == 2) + statuses.Count(s => s == 3);
            bundle.AttendanceRatePercent = denom > 0 ? 100.0 * present / denom : null;
        }

        return bundle;
    }

    private sealed class TestBundle
    {
        public double? CurrentAvg;
        public double? AvgImprovement;
        public double? ImprovedSharePercent;
    }

    private async Task<Dictionary<int, TestBundle>> LoadTestBundlesAsync(
        int teamId, List<int> testDefIds, DateTime from, DateTime toExcl)
    {
        var memberIds = await context.TeamMembers
            .Where(tm => tm.TeamId == teamId)
            .Select(tm => tm.MemberId)
            .Distinct()
            .ToListAsync();

        var result = testDefIds.ToDictionary(id => id, _ => new TestBundle());
        if (memberIds.Count == 0) return result;

        var defs = await context.TestDefinitions
            .Where(d => testDefIds.Contains(d.Id))
            .Select(d => new { d.Id, d.HigherIsBetter })
            .ToDictionaryAsync(d => d.Id, d => d.HigherIsBetter);

        var rows = await context.TestResults
            .Where(r => testDefIds.Contains(r.TestDefinitionId)
                        && memberIds.Contains(r.MemberId)
                        && r.NumericValue != null
                        && r.TestDate >= from && r.TestDate < toExcl)
            .Select(r => new { r.TestDefinitionId, r.MemberId, Value = r.NumericValue!.Value, r.TestDate })
            .ToListAsync();

        foreach (var defId in testDefIds)
        {
            var higherIsBetter = defs.GetValueOrDefault(defId, true);
            var byMember = rows.Where(r => r.TestDefinitionId == defId)
                .GroupBy(r => r.MemberId)
                .ToList();
            if (byMember.Count == 0) continue;

            var latest = byMember
                .Select(g => g.OrderBy(r => r.TestDate).Last().Value)
                .ToList();
            result[defId].CurrentAvg = Math.Round(latest.Average(), 2);

            var improvements = byMember
                .Where(g => g.Count() >= 2)
                .Select(g =>
                {
                    var ordered = g.OrderBy(r => r.TestDate).ToList();
                    var first = ordered.First().Value;
                    var last = ordered.Last().Value;
                    return higherIsBetter ? last - first : first - last;
                })
                .ToList();

            if (improvements.Count > 0)
            {
                result[defId].AvgImprovement = Math.Round(improvements.Average(), 2);
                result[defId].ImprovedSharePercent =
                    Math.Round(100.0 * improvements.Count(x => x > 0) / improvements.Count, 1);
            }
        }

        return result;
    }

    // ── Single-goal reload ─────────────────────────────────────────────────

    private async Task<SeasonGoalDto> LoadOneAsync(int id)
    {
        var goal = await context.SeasonGoals
            .Include(g => g.TestDefinition)
            .Include(g => g.Team).ThenInclude(t => t!.Season)
            .FirstAsync(g => g.Id == id);

        var team = goal.Team!;
        if (team.Season == null)
        {
            return new SeasonGoalDto
            {
                Id = goal.Id, SeasonId = goal.SeasonId, TeamId = goal.TeamId, Metric = goal.Metric,
                TestDefinitionId = goal.TestDefinitionId, TestName = goal.TestDefinition?.Name,
                TestUnit = goal.TestDefinition?.Unit, Direction = goal.Direction, Target = goal.Target,
                ManualValue = goal.ManualValue, Note = goal.Note,
            };
        }

        var siblings = await context.SeasonGoals
            .Include(g => g.TestDefinition)
            .Where(g => g.TeamId == goal.TeamId && g.SeasonId == goal.SeasonId)
            .ToListAsync();
        var computed = await ComputeAsync(team, siblings);
        return computed.Goals.First(x => x.Id == id);
    }
}
