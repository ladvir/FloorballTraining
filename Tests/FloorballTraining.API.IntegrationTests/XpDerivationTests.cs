using System.Net.Http.Json;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// XP layer A (#94): derives an append-only XpEvent ledger from coach-entered records
/// (attendance, match stats, skill grades, test records). Covers all four sources,
/// idempotence of the recompute batch, and the summary endpoint.
/// </summary>
[Collection("Api")]
public class XpDerivationTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly DateTime _now = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);

    private int _clubId;
    private int _seasonId;
    private int _memberId;

    // Expected XP for the one player, one of each source (see XpRules):
    // training 10 + match 20 + goal 15 + assist 10 + skill improve 25 + target 50 + test PR 20 = 150
    private const int ExpectedTotal = 150;

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"XpClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var season = new Season { Name = "XpSeason", ClubId = _clubId, StartDate = _now.AddMonths(-1), EndDate = _now.AddMonths(6) };
        db.Seasons.Add(season);
        var team = new Team { Name = $"XpTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        var member = new Member { FirstName = "Xp", LastName = "Player", BirthYear = 2010, ClubId = _clubId };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        _seasonId = season.Id;
        _memberId = member.Id;

        // --- Attendance: one training + one match, both Present ---
        var training = new Appointment { AppointmentType = AppointmentType.Training, Start = _now, End = _now.AddHours(1), LocationId = 1, TeamId = team.Id };
        var match = new Appointment { AppointmentType = AppointmentType.Match, Start = _now, End = _now.AddHours(1), LocationId = 1, TeamId = team.Id };
        db.Appointments.AddRange(training, match);
        await db.SaveChangesAsync();
        db.AppointmentAttendances.AddRange(
            new AppointmentAttendance { AppointmentId = training.Id, MemberId = _memberId, Status = 1, RecordedAt = _now },
            new AppointmentAttendance { AppointmentId = match.Id, MemberId = _memberId, Status = 1, RecordedAt = _now });

        // --- Match stats: one goal + one assist ---
        var tracker = new StatTracker { EventCategory = 0, TeamId = team.Id, SeasonId = _seasonId, CreatedAt = _now, UpdatedAt = _now };
        db.StatTrackers.Add(tracker);
        await db.SaveChangesAsync();
        var participant = new StatTrackerParticipant { StatTrackerId = tracker.Id, MemberId = _memberId };
        var goals = new StatTrackerMetric { StatTrackerId = tracker.Id, Code = "goals", Name = "Góly" };
        var assists = new StatTrackerMetric { StatTrackerId = tracker.Id, Code = "assists", Name = "Asistence" };
        db.StatTrackerParticipants.Add(participant);
        db.StatTrackerMetrics.AddRange(goals, assists);
        await db.SaveChangesAsync();
        db.StatTrackerEntries.AddRange(
            new StatTrackerEntry { StatTrackerId = tracker.Id, Kind = 0, StatTrackerParticipantId = participant.Id, StatTrackerMetricId = goals.Id, Delta = 1, CreatedAt = _now },
            new StatTrackerEntry { StatTrackerId = tracker.Id, Kind = 0, StatTrackerParticipantId = participant.Id, StatTrackerMetricId = assists.Id, Delta = 1, CreatedAt = _now });

        // --- Skill grade: 4 -> 3 improvement, target 3 reached on the second rating ---
        var category = new SkillCategory { Name = $"XpCat-{Guid.NewGuid():N}", Position = SkillCategoryPosition.FieldPlayer, SortOrder = 1 };
        db.SkillCategories.Add(category);
        await db.SaveChangesAsync();
        var skill = new Skill { SkillCategoryId = category.Id, Name = "XpSkill", SortOrder = 1 };
        db.Skills.Add(skill);
        await db.SaveChangesAsync();
        db.PlayerSkillRatings.AddRange(
            new PlayerSkillRating { MemberId = _memberId, SkillId = skill.Id, Grade = 4, TargetGrade = 3, RatedAt = _now.AddDays(-2) },
            new PlayerSkillRating { MemberId = _memberId, SkillId = skill.Id, Grade = 3, TargetGrade = 3, RatedAt = _now });

        // --- Test personal record: 100 then 120 (higher is better) ---
        var testDef = new TestDefinition { Name = $"XpTest-{Guid.NewGuid():N}", Category = TestCategory.Conditioning, TestType = TestType.Number, HigherIsBetter = true };
        db.TestDefinitions.Add(testDef);
        await db.SaveChangesAsync();
        db.TestResults.AddRange(
            new TestResult { TestDefinitionId = testDef.Id, MemberId = _memberId, NumericValue = 100, TestDate = _now.AddDays(-2) },
            new TestResult { TestDefinitionId = testDef.Id, MemberId = _memberId, NumericValue = 120, TestDate = _now });

        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<int> CountMyEventsAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        return await db.XpEvents.CountAsync(e => e.MemberId == _memberId);
    }

    [Fact]
    public async Task Recompute_DerivesAllFourSources_AndIsIdempotent()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var xp = scope.ServiceProvider.GetRequiredService<XpService>();

        var firstInserted = await xp.RecomputeAllAsync();
        firstInserted.Should().BeGreaterThanOrEqualTo(7); // at least this player's 7 events

        var summary = await xp.GetSummaryAsync(_memberId);
        summary.TotalXp.Should().Be(ExpectedTotal);
        summary.BySeason.Should().ContainSingle(s => s.SeasonId == _seasonId && s.Xp == ExpectedTotal);

        // Each expected type produced exactly one event for this player.
        var myEvents = await CountMyEventsAsync();
        myEvents.Should().Be(7);

        // Second run must add nothing and leave totals unchanged (idempotence).
        var secondInserted = await xp.RecomputeAllAsync();
        secondInserted.Should().Be(0);
        (await CountMyEventsAsync()).Should().Be(7);
        (await xp.GetSummaryAsync(_memberId)).TotalXp.Should().Be(ExpectedTotal);
    }

    [Fact]
    public async Task Recompute_PrunesOrphanedXp_WhenSourceDeletedOrDowngraded()
    {
        // Baseline: full 150 XP.
        await using (var scope = factory.Services.CreateAsyncScope())
            await scope.ServiceProvider.GetRequiredService<XpService>().RecomputeAllAsync();

        // Retire two sources: downgrade the training attendance Present -> Absent, and delete the goal.
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var trainingAtt = await db.AppointmentAttendances.Include(a => a.Appointment)
                .FirstAsync(a => a.MemberId == _memberId && a.Appointment!.AppointmentType == AppointmentType.Training);
            trainingAtt.Status = 2; // Absent
            var goalEntry = await db.StatTrackerEntries.Include(e => e.Metric).Include(e => e.Participant)
                .FirstAsync(e => e.Metric!.Code == "goals" && e.Participant!.MemberId == _memberId);
            db.StatTrackerEntries.Remove(goalEntry);
            await db.SaveChangesAsync();
        }

        // Recompute must prune the now-orphaned XP: training attendance (10) + goal (15) → 150 - 25 = 125.
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var xp = scope.ServiceProvider.GetRequiredService<XpService>();
            await xp.RecomputeAllAsync();
            (await xp.GetSummaryAsync(_memberId)).TotalXp
                .Should().Be(ExpectedTotal - XpRules.TrainingAttendance - XpRules.Goal);

            // And it stays pruned on a re-run (idempotent).
            await xp.RecomputeAllAsync();
            (await xp.GetSummaryAsync(_memberId)).TotalXp
                .Should().Be(ExpectedTotal - XpRules.TrainingAttendance - XpRules.Goal);
        }
    }

    [Fact]
    public async Task Endpoint_ReturnsLifetimeAndSeasonXp()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<XpService>().RecomputeAllAsync();
        }

        var client = factory.CreateClient();
        var token = await LoginHelper.GetAdminTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var summary = await client.GetFromJsonAsync<XpSummaryDto>($"/xp/member/{_memberId}");
        summary!.TotalXp.Should().Be(ExpectedTotal);
        summary.BySeason.Should().ContainSingle(s => s.SeasonId == _seasonId && s.Xp == ExpectedTotal && s.Stars == 3);

        // Career (#95): 150 XP → rank Hráč, plus progress toward the next rank/level.
        summary.Career.Rank.Should().Be("Hráč");
        summary.Career.RankIndex.Should().Be(1);
        summary.Career.NextRank.Should().Be("Stálice");
    }
}
