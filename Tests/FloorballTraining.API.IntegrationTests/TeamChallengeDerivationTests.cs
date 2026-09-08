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
/// Team challenges (#156): a coach-authored <see cref="ChallengeMetric"/> summed across the team roster
/// over a window. Covers the AC — team total reaches the target → one completion per rostered player →
/// bonus XP each through the ledger; idempotence; reconciliation both ways (target raised / challenge
/// deactivated removes derived completions and their XP); manual challenges are never auto-completed.
/// </summary>
[Collection("Api")]
public class TeamChallengeDerivationTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly DateTime _now = new(2026, 3, 3, 12, 0, 0, DateTimeKind.Utc); // a Tuesday
    private int _clubId;
    private int _teamId;
    private int _memberA;
    private int _memberB;

    private static string Week(DateTime d) => $"{ISOWeek.GetYear(d)}-W{ISOWeek.GetWeekOfYear(d):00}";

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"TcClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var team = new Team { Name = $"TcTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Teams.Add(team);
        var a = new Member { FirstName = "Alfa", LastName = "Hrac", BirthYear = 2011, ClubId = _clubId };
        var b = new Member { FirstName = "Beta", LastName = "Hrac", BirthYear = 2011, ClubId = _clubId };
        db.Members.AddRange(a, b);
        await db.SaveChangesAsync();
        _teamId = team.Id;
        _memberA = a.Id;
        _memberB = b.Id;

        db.TeamMembers.AddRange(
            new TeamMember { TeamId = _teamId, MemberId = _memberA, IsPlayer = true },
            new TeamMember { TeamId = _teamId, MemberId = _memberB, IsPlayer = true });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<int> AddDerivedChallengeAsync(int target, int rewardXp = 50)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var tc = new TeamChallenge
        {
            TeamId = _teamId,
            Name = "Týmová docházka",
            IsManual = false,
            Metric = ChallengeMetric.TrainingAttendance,
            Target = target,
            Window = TeamChallengeWindow.Week,
            RewardXp = rewardXp,
            IsActive = true,
        };
        db.TeamChallenges.Add(tc);
        await db.SaveChangesAsync();
        return tc.Id;
    }

    private async Task AddTrainingsAsync(int memberId, DateTime weekMonday, int count)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        for (var i = 0; i < count; i++)
        {
            var when = weekMonday.AddDays(i);
            var appt = new Appointment { AppointmentType = AppointmentType.Training, Start = when, End = when.AddHours(1), LocationId = 1, TeamId = _teamId };
            db.Appointments.Add(appt);
            await db.SaveChangesAsync();
            db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = appt.Id, MemberId = memberId, Status = 1, RecordedAt = when });
        }
        await db.SaveChangesAsync();
    }

    private async Task RecomputeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<TeamChallengeService>().RecomputeAllAsync();
        await scope.ServiceProvider.GetRequiredService<XpService>().RecomputeAllAsync();
    }

    private async Task<(List<TeamChallengeCompletion> Completions, List<XpEvent> Bonus)> StateAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var completions = await db.TeamChallengeCompletions.AsNoTracking()
            .Where(c => c.MemberId == _memberA || c.MemberId == _memberB).ToListAsync();
        var bonus = await db.XpEvents.AsNoTracking()
            .Where(e => (e.MemberId == _memberA || e.MemberId == _memberB) && e.Type == XpEventType.TeamChallengeReward)
            .ToListAsync();
        return (completions, bonus);
    }

    [Fact]
    public async Task TeamTotal_ReachesTarget_CompletesForEveryPlayer_AwardsBonusXp_AndIsIdempotent()
    {
        await AddDerivedChallengeAsync(target: 4, rewardXp: 50);
        await AddTrainingsAsync(_memberA, _now.Date.AddDays(-1), 2); // Mon–Tue of _now's week
        await AddTrainingsAsync(_memberB, _now.Date.AddDays(-1), 2); // team total = 4 → hits target

        await RecomputeAsync();

        var (completions, bonus) = await StateAsync();
        completions.Should().HaveCount(2); // one per rostered player
        completions.Select(c => c.MemberId).Should().BeEquivalentTo(new[] { _memberA, _memberB });
        completions.Should().OnlyContain(c => c.PeriodKey == Week(_now) && c.CompletedByUserId == null);
        bonus.Should().HaveCount(2);
        bonus.Should().OnlyContain(e => e.Points == 50); // priced units(=RewardXp) × 1

        // Idempotent: a second pass over the same records changes nothing.
        await RecomputeAsync();
        var (again, againBonus) = await StateAsync();
        again.Should().HaveCount(2);
        againBonus.Should().HaveCount(2);
    }

    [Fact]
    public async Task BelowTarget_DoesNotComplete()
    {
        await AddDerivedChallengeAsync(target: 5);
        await AddTrainingsAsync(_memberA, _now.Date.AddDays(-1), 2);
        await AddTrainingsAsync(_memberB, _now.Date.AddDays(-1), 2); // total 4 < 5

        await RecomputeAsync();

        var (completions, bonus) = await StateAsync();
        completions.Should().BeEmpty();
        bonus.Should().BeEmpty();
    }

    [Fact]
    public async Task RaisingTarget_RevokesDerivedCompletionsAndTheirXp()
    {
        var id = await AddDerivedChallengeAsync(target: 4);
        await AddTrainingsAsync(_memberA, _now.Date.AddDays(-1), 2);
        await AddTrainingsAsync(_memberB, _now.Date.AddDays(-1), 2);
        await RecomputeAsync();
        (await StateAsync()).Completions.Should().HaveCount(2);

        // Coach fixes a typo: target should have been 10, which the team no longer meets.
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var tc = await db.TeamChallenges.FirstAsync(c => c.Id == id);
            tc.Target = 10;
            await db.SaveChangesAsync();
        }
        await RecomputeAsync();

        var (completions, bonus) = await StateAsync();
        completions.Should().BeEmpty();
        bonus.Should().BeEmpty();
    }

    [Fact]
    public async Task ManualChallenge_IsNeverAutoCompletedByTheService()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            db.TeamChallenges.Add(new TeamChallenge
            {
                TeamId = _teamId, Name = "Vyhrát turnaj", IsManual = true,
                Window = TeamChallengeWindow.Custom, RewardXp = 40, IsActive = true,
            });
            await db.SaveChangesAsync();
        }
        await AddTrainingsAsync(_memberA, _now.Date.AddDays(-1), 5);

        await RecomputeAsync();

        (await StateAsync()).Completions.Should().BeEmpty();
    }

    [Fact]
    public async Task GetForTeam_ReportsTeamSummedProgressForCurrentWindow()
    {
        await AddDerivedChallengeAsync(target: 4);
        await AddTrainingsAsync(_memberA, _now.Date.AddDays(-1), 1);
        await AddTrainingsAsync(_memberB, _now.Date.AddDays(-1), 2); // team total = 3 of 4

        await using var scope = factory.Services.CreateAsyncScope();
        var svc = scope.ServiceProvider.GetRequiredService<TeamChallengeService>();
        var board = await svc.GetForTeamAsync(_teamId, now: _now);

        var row = board.Challenges.Should().ContainSingle().Subject;
        row.Current.Should().Be(3);
        row.Target.Should().Be(4);
        row.Progress.Should().BeApproximately(0.75, 1e-9);
        row.Completed.Should().BeFalse();
    }
}
