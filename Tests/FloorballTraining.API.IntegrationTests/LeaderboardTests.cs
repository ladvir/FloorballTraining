using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Leaderboards (#98): aggregate the XpEvent ledger into club/team rankings. Verifies the fairness rule
/// (seasonal XP is the default, so a rising player outranks a veteran with more lifetime XP), the career
/// toggle, team-vs-club scoping, and the auto-derived player of the month.
/// </summary>
[Collection("Api")]
public class LeaderboardTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly DateTime _now = DateTime.UtcNow;
    private int _clubId, _seasonId, _teamId;
    private int _veteran, _riser, _outsider;
    private int _srcSeq;

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"LbClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        _clubId = club.Id;

        var season = new Season { Name = "LbSeason", ClubId = _clubId, StartDate = _now.AddMonths(-1), EndDate = _now.AddMonths(6) };
        var team = new Team { Name = $"LbTeam-{Guid.NewGuid():N}", ClubId = _clubId, AgeGroupId = 1 };
        db.Seasons.Add(season);
        db.Teams.Add(team);
        var veteran = new Member { FirstName = "Vera", LastName = "Veteran", BirthYear = 2008, ClubId = _clubId };
        var riser = new Member { FirstName = "Ron", LastName = "Riser", BirthYear = 2012, ClubId = _clubId };
        var outsider = new Member { FirstName = "Ota", LastName = "Outsider", BirthYear = 2010, ClubId = _clubId };
        db.Members.AddRange(veteran, riser, outsider);
        await db.SaveChangesAsync();
        _seasonId = season.Id;
        _teamId = team.Id;
        _veteran = veteran.Id;
        _riser = riser.Id;
        _outsider = outsider.Id;

        // Veteran + riser are on the team; outsider is club-only.
        db.TeamMembers.AddRange(
            new TeamMember { TeamId = _teamId, MemberId = _veteran, IsPlayer = true },
            new TeamMember { TeamId = _teamId, MemberId = _riser, IsPlayer = true });

        // Veteran: big lifetime (old, no season), tiny this season, nothing recent.
        Xp(db, _veteran, 500, seasonId: null, _now.AddYears(-1));
        Xp(db, _veteran, 30, _seasonId, _now.AddMonths(-1));
        // Riser: less lifetime but the most this season, earned recently → player of the month.
        Xp(db, _riser, 200, _seasonId, _now.AddDays(-2));
        // Outsider (club only): high season XP but not on the team.
        Xp(db, _outsider, 120, _seasonId, _now.AddMonths(-2));

        await db.SaveChangesAsync();
    }

    private void Xp(FloorballTrainingContext db, int memberId, int points, int? seasonId, DateTime when) =>
        db.XpEvents.Add(new XpEvent
        {
            MemberId = memberId, Type = XpEventType.TrainingAttendance, Points = points, SeasonId = seasonId,
            SourceKind = XpSourceKind.Attendance, SourceId = ++_srcSeq * 100000 + memberId, OccurredAt = when
        });

    public Task DisposeAsync() => Task.CompletedTask;

    private LeaderboardService Svc(IServiceScope scope) =>
        scope.ServiceProvider.GetRequiredService<LeaderboardService>();

    [Fact]
    public async Task Team_SeasonalDefault_RanksRiserAboveVeteran_AndCareerTogglesIt()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var svc = Svc(scope);

        // Default (seasonal): riser (200) outranks veteran (30) despite the veteran's larger lifetime.
        var season = await svc.GetAsync(_clubId, _teamId, _seasonId, "season");
        season.Rows.Select(r => r.MemberId).Should().Equal(_riser, _veteran);
        season.Rows[0].Position.Should().Be(1);
        season.Rows.Should().NotContain(r => r.MemberId == _outsider); // team scope excludes club-only member

        // Career toggle: veteran (530 lifetime) outranks riser (200).
        var career = await svc.GetAsync(_clubId, _teamId, _seasonId, "career");
        career.Rows.Select(r => r.MemberId).Should().Equal(_veteran, _riser);
        career.Rows.Single(r => r.MemberId == _veteran).LifetimeXp.Should().Be(530);
    }

    [Fact]
    public async Task Teams_RankByAvgPerPlayerByDefault_WithTotalAndChallengesToggles()
    {
        int teamBId, teamAChallengeCompletions;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

            // Team B: a single player with more season XP than Team A's per-player average (230/2 = 115).
            var teamB = new Team { Name = "LbTeamB", ClubId = _clubId, AgeGroupId = 1 };
            db.Teams.Add(teamB);
            var solo = new Member { FirstName = "Sam", LastName = "Solo", BirthYear = 2011, ClubId = _clubId };
            db.Members.Add(solo);
            await db.SaveChangesAsync();
            teamBId = teamB.Id;
            db.TeamMembers.Add(new TeamMember { TeamId = teamBId, MemberId = solo.Id, IsPlayer = true });
            Xp(db, solo.Id, 150, _seasonId, _now.AddDays(-3));

            // Team A completed one team challenge (2 rostered players → 2 completion rows, 1 distinct window).
            var tc = new TeamChallenge
            {
                TeamId = _teamId, Name = "Docházka", IsManual = false,
                Metric = ChallengeMetric.TrainingAttendance, Target = 4, Window = TeamChallengeWindow.Month, RewardXp = 20,
            };
            db.TeamChallenges.Add(tc);
            await db.SaveChangesAsync();
            db.TeamChallengeCompletions.AddRange(
                new TeamChallengeCompletion { TeamChallengeId = tc.Id, MemberId = _veteran, PeriodKey = "2026-M03" },
                new TeamChallengeCompletion { TeamChallengeId = tc.Id, MemberId = _riser, PeriodKey = "2026-M03" });
            await db.SaveChangesAsync();
            teamAChallengeCompletions = 1;
        }

        await using var check = factory.Services.CreateAsyncScope();
        var svc = Svc(check);

        // avg (default): Team B (150 / 1) outranks Team A (230 / 2 = 115).
        var byAvg = await svc.GetTeamsAsync(_clubId, _seasonId, "avg");
        byAvg.Rows.Select(r => r.TeamId).Should().Equal(teamBId, _teamId);
        var teamARow = byAvg.Rows.Single(r => r.TeamId == _teamId);
        teamARow.PlayerCount.Should().Be(2);
        teamARow.SeasonXp.Should().Be(230);
        teamARow.AvgXp.Should().Be(115);
        teamARow.ChallengesCompleted.Should().Be(teamAChallengeCompletions);

        // total: Team A (230) outranks Team B (150).
        (await svc.GetTeamsAsync(_clubId, _seasonId, "total")).Rows.Select(r => r.TeamId).Should().Equal(_teamId, teamBId);

        // challenges: Team A (1 completed) outranks Team B (0).
        (await svc.GetTeamsAsync(_clubId, _seasonId, "challenges")).Rows.Select(r => r.TeamId).Should().Equal(_teamId, teamBId);
    }

    [Fact]
    public async Task Club_IncludesAllMembers_AndPicksPlayerOfMonth()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var svc = Svc(scope);

        // seasonId: null → the service resolves the club's current season (LbSeason contains today).
        var club = await svc.GetAsync(_clubId, teamId: null, seasonId: null, "season");
        club.SeasonId.Should().Be(_seasonId);
        club.Rows.Select(r => r.MemberId).Should().Contain(new[] { _veteran, _riser, _outsider });

        // Player of the month = top XP gainer in the trailing 30 days (only the riser earned recently).
        club.PlayerOfMonth.Should().NotBeNull();
        club.PlayerOfMonth!.MemberId.Should().Be(_riser);
        club.PlayerOfMonth.RecentXp.Should().Be(200);
    }
}
