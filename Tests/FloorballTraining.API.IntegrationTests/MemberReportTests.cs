using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Player report aggregation (GET /members/{id}/report): benchmark colours and
/// trends on seeded results, strengths/weaknesses, weighted quality score,
/// access rules (foreign-club coach forbidden) and the GDPR audit trail;
/// plus the admin-only /reportweights configuration.
/// </summary>
[Collection("Api")]
public class MemberReportTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";

    private readonly string _headCoachEmail = $"rep-hc-{Guid.NewGuid():N}@test.example";
    private readonly string _foreignCoachEmail = $"rep-foreign-{Guid.NewGuid():N}@test.example";

    private int _clubId;
    private int _teamId;
    private int _playerId;
    private int _sprintTestId;
    private int _jumpTestId;

    public MemberReportTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"RepClub-{Guid.NewGuid():N}" };
        var foreignClub = new Club { Name = $"RepForeign-{Guid.NewGuid():N}" };
        db.Clubs.AddRange(club, foreignClub);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var team = new Team { Name = $"RepTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        _teamId = team.Id;

        var player = new Member
        {
            FirstName = "Report", LastName = "Player", BirthYear = 2010,
            Gender = Gender.Male, ClubId = _clubId
        };
        db.Members.Add(player);
        await db.SaveChangesAsync();
        _playerId = player.Id;
        db.TeamMembers.Add(new TeamMember { TeamId = _teamId, MemberId = _playerId, IsPlayer = true });

        // Sprint (lower is better): improving times, latest inside the green band → strength.
        var sprint = new TestDefinition
        {
            Name = $"Sprint-{Guid.NewGuid():N}", TestType = TestType.Number,
            Unit = "s", HigherIsBetter = false
        };
        sprint.ColourRanges.Add(new TestColourRange
        {
            AgeGroupId = 1, Gender = Gender.Male,
            GreenFrom = 0, GreenTo = 12, YellowFrom = 12, YellowTo = 14
        });
        // Jump (higher is better): worsening values, latest below yellow → red weakness.
        var jump = new TestDefinition
        {
            Name = $"Jump-{Guid.NewGuid():N}", TestType = TestType.Number,
            Unit = "cm", HigherIsBetter = true
        };
        jump.ColourRanges.Add(new TestColourRange
        {
            AgeGroupId = 1, Gender = Gender.Male,
            GreenFrom = 180, GreenTo = 300, YellowFrom = 150, YellowTo = 180
        });
        db.TestDefinitions.AddRange(sprint, jump);
        await db.SaveChangesAsync();
        _sprintTestId = sprint.Id;
        _jumpTestId = jump.Id;

        var now = DateTime.UtcNow;
        db.TestResults.AddRange(
            new TestResult { TestDefinitionId = sprint.Id, MemberId = _playerId, NumericValue = 14.0, TestDate = now.AddMonths(-6), RecordedByUserId = "seed" },
            new TestResult { TestDefinitionId = sprint.Id, MemberId = _playerId, NumericValue = 13.0, TestDate = now.AddMonths(-3), RecordedByUserId = "seed" },
            new TestResult { TestDefinitionId = sprint.Id, MemberId = _playerId, NumericValue = 11.5, TestDate = now.AddMonths(-1), RecordedByUserId = "seed" },
            new TestResult { TestDefinitionId = jump.Id, MemberId = _playerId, NumericValue = 185, TestDate = now.AddMonths(-6), RecordedByUserId = "seed" },
            new TestResult { TestDefinitionId = jump.Id, MemberId = _playerId, NumericValue = 160, TestDate = now.AddMonths(-3), RecordedByUserId = "seed" },
            new TestResult { TestDefinitionId = jump.Id, MemberId = _playerId, NumericValue = 140, TestDate = now.AddMonths(-1), RecordedByUserId = "seed" },
            // Outside the 12-month window — must be ignored.
            new TestResult { TestDefinitionId = sprint.Id, MemberId = _playerId, NumericValue = 99, TestDate = now.AddMonths(-20), RecordedByUserId = "seed" });

        // Attendance: 3 of 4 present. Workouts: 1 completed, 1 skipped.
        var place = new Place { Name = $"RepHall-{Guid.NewGuid():N}" };
        db.Places.Add(place);
        await db.SaveChangesAsync();
        var appointments = Enumerable.Range(0, 4)
            .Select(i => new Appointment
            {
                Name = $"Rep-{i}", TeamId = _teamId, LocationId = place.Id,
                Start = now.AddDays(-i - 1), End = now.AddDays(-i - 1).AddHours(1)
            })
            .ToList();
        db.Appointments.AddRange(appointments);
        await db.SaveChangesAsync();
        for (var i = 0; i < 4; i++)
            db.AppointmentAttendances.Add(new AppointmentAttendance
            {
                AppointmentId = appointments[i].Id,
                MemberId = _playerId,
                Status = i < 3 ? 1 : 2,
                RecordedAt = now.AddDays(-i - 1)
            });

        db.IndividualWorkouts.AddRange(
            new IndividualWorkout { MemberId = _playerId, Title = "W1", Status = 1, AssignedByUserId = "seed", AssignedAt = now.AddDays(-10) },
            new IndividualWorkout { MemberId = _playerId, Title = "W2", Status = 2, AssignedByUserId = "seed", AssignedAt = now.AddDays(-5) });

        // Canadian scoring: 2 goals + 1 assist across 2 matches.
        var tracker1 = new StatTracker { TeamId = _teamId, EventCategory = 0, CreatedAt = now.AddDays(-8), UpdatedAt = now.AddDays(-8) };
        var tracker2 = new StatTracker { TeamId = _teamId, EventCategory = 0, CreatedAt = now.AddDays(-4), UpdatedAt = now.AddDays(-4) };
        db.StatTrackers.AddRange(tracker1, tracker2);
        await db.SaveChangesAsync();
        var participant1 = new StatTrackerParticipant { StatTrackerId = tracker1.Id, MemberId = _playerId };
        var participant2 = new StatTrackerParticipant { StatTrackerId = tracker2.Id, MemberId = _playerId };
        var goals1 = new StatTrackerMetric { StatTrackerId = tracker1.Id, Code = "goals", Name = "Góly" };
        var assists1 = new StatTrackerMetric { StatTrackerId = tracker1.Id, Code = "assists", Name = "Asistence" };
        var goals2 = new StatTrackerMetric { StatTrackerId = tracker2.Id, Code = "goals", Name = "Góly" };
        db.StatTrackerParticipants.AddRange(participant1, participant2);
        db.StatTrackerMetrics.AddRange(goals1, assists1, goals2);
        await db.SaveChangesAsync();
        db.StatTrackerEntries.AddRange(
            new StatTrackerEntry { StatTrackerId = tracker1.Id, StatTrackerParticipantId = participant1.Id, StatTrackerMetricId = goals1.Id, Delta = 1, CreatedAt = now.AddDays(-8) },
            new StatTrackerEntry { StatTrackerId = tracker1.Id, StatTrackerParticipantId = participant1.Id, StatTrackerMetricId = assists1.Id, Delta = 1, CreatedAt = now.AddDays(-8) },
            new StatTrackerEntry { StatTrackerId = tracker2.Id, StatTrackerParticipantId = participant2.Id, StatTrackerMetricId = goals2.Id, Delta = 1, CreatedAt = now.AddDays(-4) });

        // Head coach of the club + coach of a different club.
        var headCoach = new AppUser
        {
            UserName = _headCoachEmail, Email = _headCoachEmail,
            FirstName = "Rep", LastName = "HeadCoach", DefaultClubId = _clubId
        };
        (await um.CreateAsync(headCoach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Rep", LastName = "HeadCoach", Email = _headCoachEmail, BirthYear = 1985,
            ClubId = _clubId, AppUserId = headCoach.Id, HasClubRoleMainCoach = true
        });

        var foreignCoach = new AppUser
        {
            UserName = _foreignCoachEmail, Email = _foreignCoachEmail,
            FirstName = "Foreign", LastName = "Coach", DefaultClubId = foreignClub.Id
        };
        (await um.CreateAsync(foreignCoach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Foreign", LastName = "Coach", Email = _foreignCoachEmail, BirthYear = 1985,
            ClubId = foreignClub.Id, AppUserId = foreignCoach.Id, HasClubRoleCoach = true
        });

        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<HttpClient> ClientFor(string email)
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    [Fact]
    public async Task Report_AggregatesColoursTrendsHighlightsAndScore()
    {
        var headCoach = await ClientFor(_headCoachEmail);
        var report = await headCoach.GetFromJsonAsync<PlayerReportDto>($"/members/{_playerId}/report");

        report!.Member.FirstName.Should().Be("Report");
        report.Member.Age.Should().Be(DateTime.UtcNow.Year - 2010);
        report.Member.Teams.Should().ContainSingle();

        // Sprint: improving (times falling), latest 11.5 in green → strength.
        var sprint = report.Tests.Single(t => t.TestDefinitionId == _sprintTestId);
        sprint.Results.Should().HaveCount(3, "the 20-month-old result is outside the window");
        sprint.LatestColour.Should().Be("green");
        sprint.Trend.Should().Be(1);
        sprint.BenchmarkText.Should().Contain("12");
        report.Strengths.Should().ContainSingle(s => s.TestDefinitionId == _sprintTestId);

        // Jump: worsening, latest 140 below the yellow band → red weakness.
        var jump = report.Tests.Single(t => t.TestDefinitionId == _jumpTestId);
        jump.LatestColour.Should().Be("red");
        jump.Trend.Should().Be(-1);
        report.Weaknesses.Should().ContainSingle(w => w.TestDefinitionId == _jumpTestId);

        report.Scoring.Should().BeEquivalentTo(new PlayerReportScoringDto
        {
            Goals = 2, Assists = 1, Points = 3, Games = 2
        });
        report.Attendance.Present.Should().Be(3);
        report.Attendance.Total.Should().Be(4);
        report.Attendance.Pct.Should().Be(75);
        report.Workouts.Assigned.Should().Be(2);
        report.Workouts.Completed.Should().Be(1);
        report.Workouts.Pct.Should().Be(50);

        // Components: tests (100+0)/2=50, attendance 75, workouts 50, game stats 50
        // (only tracked player in the club) → default weights 0.4/0.2/0.2/0.2 → 55.
        report.ScoreBreakdown.TestsScore.Should().Be(50);
        report.ScoreBreakdown.GameStatsScore.Should().Be(50);
        report.QualityScore.Should().Be(55);
    }

    [Fact]
    public async Task Report_ForeignClubCoach_IsForbidden_AndViewIsAudited()
    {
        var foreignCoach = await ClientFor(_foreignCoachEmail);
        (await foreignCoach.GetAsync($"/members/{_playerId}/report"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var headCoach = await ClientFor(_headCoachEmail);
        (await headCoach.GetAsync($"/members/{_playerId}/report")).EnsureSuccessStatusCode();

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db.AuditLogs.AnyAsync(a =>
                a.Action == "MemberReport.Viewed" && a.EntityId == _playerId.ToString()))
            .Should().BeTrue();
    }

    [Fact]
    public async Task Recommendations_GroundedInActivities_LogsUsageWithMemberId()
    {
        // Arrange: AI on globally + for the club, head coach owns the credential,
        // and one activity exists as grounding material.
        var admin = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(admin);
        admin.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);
        (await admin.PutAsJsonAsync("/aisettings/global",
            new UpdateAiSettingsRequest { Enabled = true })).EnsureSuccessStatusCode();
        (await admin.PutAsJsonAsync($"/aisettings/club/{_clubId}",
            new UpdateAiSettingsRequest { Enabled = true })).EnsureSuccessStatusCode();

        var headCoach = await ClientFor(_headCoachEmail);
        var credentials = await headCoach.GetFromJsonAsync<List<AiCredentialDto>>("/aicredentials");
        if (credentials!.Count == 0)
            (await headCoach.PostAsJsonAsync("/aicredentials", new CreateAiCredentialRequest
            {
                Name = "Rep key", Provider = AiProvider.Anthropic, ApiKey = "sk-rep-test"
            })).EnsureSuccessStatusCode();

        int activityId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var activity = new Activity { Name = "Odrazová průprava", IsDraft = false };
            db.Activities.Add(activity);
            await db.SaveChangesAsync();
            activityId = activity.Id;
        }

        var hallucinatedId = activityId + 555555;
        var recommendationsJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            recommendations = new object[]
            {
                new { title = "Zlepšit odraz", rationale = "Slabý skok", activityIds = new[] { activityId, hallucinatedId } },
                new { title = "Udržet sprint", rationale = "Silná stránka", activityIds = Array.Empty<int>() },
            }
        });
        _factory.HttpStubs["https://api.anthropic.com/v1/messages"] = System.Text.Json.JsonSerializer.Serialize(new
        {
            content = new object[] { new { type = "text", text = recommendationsJson } },
            usage = new { input_tokens = 30, output_tokens = 12 }
        });

        // Act
        var response = await headCoach.PostAsync($"/members/{_playerId}/report/recommendations", null);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AiRecommendationsResultDto>();

        // Assert: hallucinated id dropped with a warning, real one resolved to its name.
        result!.Recommendations.Should().HaveCount(2);
        result.Recommendations[0].Activities.Should()
            .ContainSingle(a => a.ActivityId == activityId && a.ActivityName == "Odrazová průprava");
        result.Warnings.Should().ContainSingle(w =>
            w.Code == "unknownActivity" && w.Value == hallucinatedId.ToString());
        result.Usage.InputTokens.Should().Be(30);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var log = await db.AiUsageLogs
                .Where(l => l.Feature == AiFeature.PlayerReport && l.MemberId == _playerId)
                .OrderByDescending(l => l.Id)
                .FirstOrDefaultAsync();
            log.Should().NotBeNull();
            log!.Success.Should().BeTrue();
            log.ClubId.Should().Be(_clubId);
        }

        // Foreign coach must not trigger recommendations either.
        var foreignCoach = await ClientFor(_foreignCoachEmail);
        (await foreignCoach.PostAsync($"/members/{_playerId}/report/recommendations", null))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ReportWeights_AdminOnly_ValidatesSum_AndAffectsScore()
    {
        var headCoach = await ClientFor(_headCoachEmail);
        (await headCoach.GetAsync("/reportweights")).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var admin = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(admin);
        admin.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);

        var all = await admin.GetFromJsonAsync<List<ReportScoreWeightDto>>("/reportweights");
        all!.Should().NotBeEmpty();
        all.Should().OnlyContain(w => !w.IsCustomized, "no weights are stored yet");

        // Sum != 1 → rejected.
        (await admin.PutAsJsonAsync("/reportweights", new UpdateReportScoreWeightRequest
        {
            AgeGroupId = 1, WeightTests = 0.9, WeightAttendance = 0.9, WeightWorkouts = 0, WeightGameStats = 0
        })).StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Tests-only weights → the score becomes the tests component (50).
        (await admin.PutAsJsonAsync("/reportweights", new UpdateReportScoreWeightRequest
        {
            AgeGroupId = 1, WeightTests = 1, WeightAttendance = 0, WeightWorkouts = 0, WeightGameStats = 0
        })).EnsureSuccessStatusCode();

        var report = await headCoach.GetFromJsonAsync<PlayerReportDto>($"/members/{_playerId}/report");
        report!.QualityScore.Should().Be(50);

        // Restore defaults so other tests are unaffected.
        (await admin.PutAsJsonAsync("/reportweights", new UpdateReportScoreWeightRequest
        {
            AgeGroupId = 1, WeightTests = 0.4, WeightAttendance = 0.2, WeightWorkouts = 0.2, WeightGameStats = 0.2
        })).EnsureSuccessStatusCode();
    }
}
