using System.Globalization;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Self-completable challenges (#108): derived per rolling window from the same coach-entered records as
/// XP. Covers the AC cases — window progress, completion → bonus XP through the ledger, idempotence per
/// window (one completion per member/code/window), and that the catalog is self-actionable only.
/// </summary>
[Collection("Api")]
public class ChallengeDerivationTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    // A Tuesday — its ISO week holds Mon–Wed below; the following week is +7 days.
    private readonly DateTime _now = new(2026, 3, 3, 12, 0, 0, DateTimeKind.Utc);
    private int _clubId;
    private int _teamId;
    private int _memberId;

    private static string Week(DateTime d) => $"{ISOWeek.GetYear(d)}-W{ISOWeek.GetWeekOfYear(d):00}";
    private static readonly ChallengeCatalog.Def Train3 = ChallengeCatalog.ByCode[nameof(ChallengeCode.Train3PerWeek)];

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"ChClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var team = new Team { Name = $"ChTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        var member = new Member { FirstName = "Chal", LastName = "Enger", BirthYear = 2011, ClubId = _clubId };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        _teamId = team.Id;
        _memberId = member.Id;

        db.TeamMembers.Add(new TeamMember { TeamId = _teamId, MemberId = _memberId, IsPlayer = true });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task AddTrainingsAsync(DateTime weekMonday, int count)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        for (var i = 0; i < count; i++)
        {
            var when = weekMonday.AddDays(i);
            var appt = new Appointment { AppointmentType = AppointmentType.Training, Start = when, End = when.AddHours(1), LocationId = 1, TeamId = _teamId };
            db.Appointments.Add(appt);
            await db.SaveChangesAsync();
            db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = appt.Id, MemberId = _memberId, Status = 1, RecordedAt = when });
        }
        await db.SaveChangesAsync();
    }

    private async Task<List<ChallengeCompletion>> CompletionsAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        return await db.ChallengeCompletions.AsNoTracking().Where(c => c.MemberId == _memberId).ToListAsync();
    }

    [Fact]
    public async Task Recompute_CompletesWeeklyChallenge_AwardsBonusXp_AndIsIdempotent()
    {
        await AddTrainingsAsync(_now.Date.AddDays(-1), 3); // Mon–Wed of _now's week → hits target 3

        await using var scope = factory.Services.CreateAsyncScope();
        var challenges = scope.ServiceProvider.GetRequiredService<ChallengeService>();
        var xp = scope.ServiceProvider.GetRequiredService<XpService>();

        (await challenges.RecomputeAllAsync()).Should().BeGreaterThanOrEqualTo(1);
        await xp.RecomputeAllAsync();

        var completions = await CompletionsAsync();
        completions.Should().ContainSingle(c => c.Code == nameof(ChallengeCode.Train3PerWeek))
            .Which.PeriodKey.Should().Be(Week(_now));

        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var bonus = await db.XpEvents.AsNoTracking()
            .Where(e => e.MemberId == _memberId && e.Type == XpEventType.ChallengeReward).ToListAsync();
        bonus.Should().ContainSingle().Which.Points.Should().Be(Train3.RewardXp); // 30, priced via units × 1

        // Idempotent: a second run over the same records completes/awards nothing new.
        (await challenges.RecomputeAllAsync()).Should().Be(0);
        (await xp.RecomputeAllAsync()).Should().Be(0);
        (await CompletionsAsync()).Should().HaveCount(completions.Count);
    }

    [Fact]
    public async Task Recompute_IsPerWindow_EachWeekCompletesSeparately_BelowTargetDoesNot()
    {
        await AddTrainingsAsync(_now.Date.AddDays(-1), 3);       // week A → complete
        await AddTrainingsAsync(_now.Date.AddDays(6), 3);        // week B (next Mon) → complete
        await AddTrainingsAsync(_now.Date.AddDays(13), 2);       // week C → below target 3

        await using var scope = factory.Services.CreateAsyncScope();
        var challenges = scope.ServiceProvider.GetRequiredService<ChallengeService>();
        var xp = scope.ServiceProvider.GetRequiredService<XpService>();
        await challenges.RecomputeAllAsync();
        await xp.RecomputeAllAsync();

        var completions = (await CompletionsAsync()).Where(c => c.Code == nameof(ChallengeCode.Train3PerWeek)).ToList();
        completions.Should().HaveCount(2);                                  // weeks A + B, not C
        completions.Select(c => c.PeriodKey).Should().OnlyHaveUniqueItems(); // one per window

        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db.XpEvents.CountAsync(e => e.MemberId == _memberId && e.Type == XpEventType.ChallengeReward))
            .Should().Be(2); // one bonus per completed window
    }

    [Fact]
    public async Task GetChallenges_ReportsCurrentWindowProgress_ThenCompletion()
    {
        await AddTrainingsAsync(_now.Date.AddDays(-1), 2); // 2 of 3 this week

        await using var scope = factory.Services.CreateAsyncScope();
        var challenges = scope.ServiceProvider.GetRequiredService<ChallengeService>();

        var board = await challenges.GetChallengesAsync(_memberId, now: _now);
        var train3 = board.Active.Single(c => c.Code == nameof(ChallengeCode.Train3PerWeek));
        train3.Current.Should().Be(2);
        train3.Target.Should().Be(3);
        train3.Progress.Should().BeApproximately(2 / 3.0, 1e-9);
        train3.Completed.Should().BeFalse();
        board.RecentlyCompleted.Should().NotContain(c => c.Code == nameof(ChallengeCode.Train3PerWeek));

        // Reach the target and recompute → now completed and listed as recently earned.
        await AddTrainingsAsync(_now.Date.AddDays(2), 1);
        await challenges.RecomputeAllAsync();

        var after = await challenges.GetChallengesAsync(_memberId, now: _now);
        var done = after.Active.Single(c => c.Code == nameof(ChallengeCode.Train3PerWeek));
        done.Completed.Should().BeTrue();
        done.Progress.Should().Be(1.0);
        after.RecentlyCompleted.Should().Contain(c => c.Code == nameof(ChallengeCode.Train3PerWeek));
    }

    [Fact]
    public void Catalog_ContainsOnlySelfActionableChallenges()
    {
        // #108: challenges must be things the player achieves alone. Coach/family-granted bonuses
        // (player-of-training, fair play, family cheered) have no metric here — guard that invariant.
        var selfActionable = new[]
        {
            ChallengeMetric.TrainingAttendance, ChallengeMetric.MatchGoal, ChallengeMetric.HomeTraining,
            ChallengeMetric.SkillImprovement, ChallengeMetric.TestPersonalRecord,
        };
        ChallengeCatalog.All.Select(d => d.Metric).Should().OnlyContain(m => selfActionable.Contains(m));
        ChallengeCatalog.All.Should().OnlyHaveUniqueItems(d => d.Code);
    }
}
