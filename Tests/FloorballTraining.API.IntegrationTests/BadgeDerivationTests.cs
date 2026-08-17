using System.Net.Http.Json;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Milestone badges (#97): derived from the same coach-entered records as XP. Covers the AC-required
/// cases — attendance thresholds, hattrick (3 goals in one match) and per-season attendance % (Iron Man) —
/// plus idempotence and the earned/in-progress status projection.
/// </summary>
[Collection("Api")]
public class BadgeDerivationTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private const string TestPassword = "Test123!";
    private readonly DateTime _now = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);
    private readonly string _coachEmail = $"badge-coach-{Guid.NewGuid():N}@test.example";
    private readonly string _achieverEmail = $"badge-achiever-{Guid.NewGuid():N}@test.example";

    private int _seasonId;
    private int _teamId;
    private int _achieverId;   // 10 present trainings + a hattrick, one season
    private int _controlId;    // 2 of 5 attendances — earns nothing

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"BadgeClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();

        var season = new Season { Name = "BadgeSeason", ClubId = club.Id, StartDate = _now.AddMonths(-1), EndDate = _now.AddMonths(6) };
        var team = new Team { Name = $"BadgeTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Seasons.Add(season);
        db.Teams.Add(team);
        var achiever = new Member { FirstName = "Ace", LastName = "Player", BirthYear = 2010, ClubId = club.Id };
        var control = new Member { FirstName = "Bench", LastName = "Warmer", BirthYear = 2010, ClubId = club.Id };
        db.Members.AddRange(achiever, control);
        await db.SaveChangesAsync();
        _seasonId = season.Id;
        _teamId = team.Id;
        _achieverId = achiever.Id;
        _controlId = control.Id;

        // Achiever: 10 trainings, all present → Attendance10 + Iron Man (10/10 = 100% ≥ 80).
        await AddTrainingsAsync(db, team.Id, achiever.Id, count: 10, present: 10);
        // Control: 5 trainings, only 2 present → below every threshold, 40% attendance.
        await AddTrainingsAsync(db, team.Id, control.Id, count: 5, present: 2);

        // Achiever: a hattrick — 3 goals in one match.
        var tracker = new StatTracker { EventCategory = 0, TeamId = team.Id, SeasonId = _seasonId, CreatedAt = _now, UpdatedAt = _now };
        db.StatTrackers.Add(tracker);
        await db.SaveChangesAsync();
        var participant = new StatTrackerParticipant { StatTrackerId = tracker.Id, MemberId = achiever.Id };
        var goals = new StatTrackerMetric { StatTrackerId = tracker.Id, Code = "goals", Name = "Góly" };
        db.StatTrackerParticipants.Add(participant);
        db.StatTrackerMetrics.Add(goals);
        await db.SaveChangesAsync();
        for (var i = 0; i < 3; i++)
            db.StatTrackerEntries.Add(new StatTrackerEntry
            {
                StatTrackerId = tracker.Id, Kind = 0, StatTrackerParticipantId = participant.Id,
                StatTrackerMetricId = goals.Id, Delta = 1, CreatedAt = _now
            });
        await db.SaveChangesAsync();

        // A club coach and the achiever's own login, for the badge-visibility HTTP test below.
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var coachUser = new AppUser { UserName = _coachEmail, Email = _coachEmail, FirstName = "Badge", LastName = "Coach", DefaultClubId = club.Id };
        (await um.CreateAsync(coachUser, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Badge", LastName = "Coach", Email = _coachEmail, BirthYear = 1985,
            ClubId = club.Id, AppUserId = coachUser.Id, HasClubRoleCoach = true
        });

        var achieverUser = new AppUser { UserName = _achieverEmail, Email = _achieverEmail, FirstName = "Ace", LastName = "Player", DefaultClubId = club.Id };
        (await um.CreateAsync(achieverUser, TestPassword)).Succeeded.Should().BeTrue();
        achiever.AppUserId = achieverUser.Id;
        achiever.Email = _achieverEmail;
        await db.SaveChangesAsync();
    }

    private async Task<HttpClient> ClientFor(string email)
    {
        var client = factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private async Task AddTrainingsAsync(FloorballTrainingContext db, int teamId, int memberId, int count, int present)
    {
        for (var i = 0; i < count; i++)
        {
            var appt = new Appointment { AppointmentType = AppointmentType.Training, Start = _now.AddDays(i), End = _now.AddDays(i).AddHours(1), LocationId = 1, TeamId = teamId };
            db.Appointments.Add(appt);
            await db.SaveChangesAsync();
            db.AppointmentAttendances.Add(new AppointmentAttendance
            {
                AppointmentId = appt.Id, MemberId = memberId, Status = i < present ? 1 : 2, RecordedAt = appt.Start
            });
        }
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<List<MemberBadge>> BadgesOf(int memberId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        return await db.MemberBadges.AsNoTracking().Where(b => b.MemberId == memberId).ToListAsync();
    }

    [Fact]
    public async Task Recompute_AwardsThresholdsHattrickIronMan_AndIsIdempotent()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var svc = scope.ServiceProvider.GetRequiredService<BadgeService>();

        await svc.RecomputeAllAsync();

        var achieverCodes = (await BadgesOf(_achieverId)).Select(b => b.Code).ToList();
        achieverCodes.Should().Contain(BadgeCode.Attendance10);   // 10 present trainings
        achieverCodes.Should().NotContain(BadgeCode.Attendance25);
        achieverCodes.Should().Contain(BadgeCode.FirstGoal);
        achieverCodes.Should().Contain(BadgeCode.Hattrick);        // 3 goals in one match
        achieverCodes.Should().NotContain(BadgeCode.Goals10);

        // Iron Man is season-scoped: exactly one row, tagged with the season (100% attendance).
        var ironMan = (await BadgesOf(_achieverId)).Where(b => b.Code == BadgeCode.IronMan).ToList();
        ironMan.Should().ContainSingle().Which.SeasonId.Should().Be(_seasonId);

        // Control earns nothing (2 trainings, 40% attendance).
        (await BadgesOf(_controlId)).Should().BeEmpty();

        // Idempotence: a second run with no new records awards nothing.
        var beforeCount = (await BadgesOf(_achieverId)).Count;
        (await svc.RecomputeAllAsync()).Should().Be(0);
        (await BadgesOf(_achieverId)).Count.Should().Be(beforeCount);
    }

    [Fact]
    public async Task GetBadges_ReportsEarnedAndInProgress()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var svc = scope.ServiceProvider.GetRequiredService<BadgeService>();
        await svc.RecomputeAllAsync();

        var badges = await svc.GetBadgesAsync(_achieverId);

        var attendance10 = badges.Single(b => b.Code == nameof(BadgeCode.Attendance10));
        attendance10.Earned.Should().BeTrue();
        attendance10.EarnedAt.Should().NotBeNull();
        attendance10.Progress.Should().Be(1.0);

        var attendance25 = badges.Single(b => b.Code == nameof(BadgeCode.Attendance25));
        attendance25.Earned.Should().BeFalse();
        attendance25.Current.Should().Be(10);
        attendance25.Progress.Should().BeApproximately(10 / 25.0, 1e-9);
    }

    [Fact]
    public async Task GetBadges_Coach_SeesLockedBadgesToo_ButPlayer_OnlySeesEarnedOnes()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var svc = scope.ServiceProvider.GetRequiredService<BadgeService>();
            await svc.RecomputeAllAsync();
        }

        var coach = await ClientFor(_coachEmail);
        var coachView = await coach.GetFromJsonAsync<List<BadgeStatusDto>>($"/xp/badges/{_achieverId}");
        coachView!.Should().Contain(b => b.Code == nameof(BadgeCode.Attendance10) && b.Earned);
        coachView.Should().Contain(b => b.Code == nameof(BadgeCode.Attendance25) && !b.Earned,
            "a coach must still see locked badges, with progress, to know what a player is close to");

        var player = await ClientFor(_achieverEmail);
        var playerView = await player.GetFromJsonAsync<List<BadgeStatusDto>>($"/xp/badges/{_achieverId}");
        playerView!.Should().OnlyContain(b => b.Earned, "a player must never see a badge before earning it");
        playerView.Should().Contain(b => b.Code == nameof(BadgeCode.Attendance10));
        playerView.Should().NotContain(b => b.Code == nameof(BadgeCode.Attendance25));
    }

    [Fact]
    public async Task Recompute_DerivesCareerExpansionMetrics_MatchesPointsHomeTrainingAndXp()
    {
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

            // One present match (MatchCount metric — Matches25/100/250).
            var match = new Appointment { AppointmentType = AppointmentType.Match, Start = _now.AddDays(20), End = _now.AddDays(20).AddHours(1), LocationId = 1, TeamId = _teamId };
            db.Appointments.Add(match);
            await db.SaveChangesAsync();
            db.AppointmentAttendances.Add(new AppointmentAttendance { AppointmentId = match.Id, MemberId = _achieverId, Status = 1, RecordedAt = match.Start });

            // Two confirmed home trainings (HomeTrainingCount metric — HomeTraining10/50/150).
            for (var i = 0; i < 2; i++)
                db.HomeTrainingLogs.Add(new HomeTrainingLog
                {
                    MemberId = _achieverId, Title = "Střelba", LoggedAt = _now.AddDays(21 + i),
                    ConfirmedByUserId = _coachEmail, ConfirmedAt = _now.AddDays(21 + i),
                });
            await db.SaveChangesAsync();
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            // XpService must run first — the new metrics (HomeTrainingCount, CareerXp, …) read the XP
            // ledger it derives, same order as GamificationRecomputeJob.
            var xp = scope.ServiceProvider.GetRequiredService<XpService>();
            await xp.RecomputeAllAsync();
            var badges = scope.ServiceProvider.GetRequiredService<BadgeService>();
            await badges.RecomputeAllAsync();
        }

        await using var readScope = factory.Services.CreateAsyncScope();
        var svc = readScope.ServiceProvider.GetRequiredService<BadgeService>();
        var status = await svc.GetBadgesAsync(_achieverId);

        status.Single(b => b.Code == nameof(BadgeCode.Matches25)).Current.Should().Be(1);
        // GoalsPlusAssists: the achiever's 3-goal hattrick + 0 assists.
        status.Single(b => b.Code == nameof(BadgeCode.Points50)).Current.Should().Be(3);
        status.Single(b => b.Code == nameof(BadgeCode.HomeTraining10)).Current.Should().Be(2);
        status.Single(b => b.Code == nameof(BadgeCode.CareerXp5000)).Current.Should().BePositive();
    }
}
