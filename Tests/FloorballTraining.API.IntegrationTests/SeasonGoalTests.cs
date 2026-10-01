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
/// Season goals API: goal CRUD, progress computed from match trackers / test results / manual
/// values, the derived season verdict + its coach override, and role-based access.
/// </summary>
[Collection("Api")]
public class SeasonGoalTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private const string TestPassword = "Test123!";

    private readonly string _coachEmail = $"goal-coach-{Guid.NewGuid():N}@test.example";
    private readonly string _otherCoachEmail = $"goal-other-{Guid.NewGuid():N}@test.example";
    private readonly string _playerEmail = $"goal-player-{Guid.NewGuid():N}@test.example";

    private int _clubId;
    private int _otherClubId;
    private int _teamId;
    private int _seasonId;
    private int _memberId1;
    private int _memberId2;

    public SeasonGoalTests(CustomWebApplicationFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var club = new Club { Name = $"GoalClub-{Guid.NewGuid():N}" };
        var otherClub = new Club { Name = $"GoalOtherClub-{Guid.NewGuid():N}" };
        db.Clubs.AddRange(club, otherClub);
        await db.SaveChangesAsync();
        _clubId = club.Id;
        _otherClubId = otherClub.Id;

        var season = new Season
        {
            Name = $"GoalSeason-{Guid.NewGuid():N}",
            StartDate = new DateTime(2020, 8, 1),
            EndDate = new DateTime(2021, 6, 30),
            ClubId = _clubId
        };
        db.Seasons.Add(season);
        await db.SaveChangesAsync();
        _seasonId = season.Id;

        var team = new Team
        {
            Name = $"GoalTeam-{Guid.NewGuid():N}",
            ClubId = _clubId,
            AgeGroupId = 1,
            SeasonId = _seasonId
        };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        _teamId = team.Id;

        var coach = new AppUser
        {
            UserName = _coachEmail,
            Email = _coachEmail,
            FirstName = "Goal",
            LastName = "Coach",
            DefaultClubId = _clubId
        };
        (await um.CreateAsync(coach, TestPassword)).Succeeded.Should().BeTrue();
        var coachMember = new Member
        {
            FirstName = "Goal",
            LastName = "Coach",
            Email = _coachEmail,
            BirthYear = 1990,
            ClubId = _clubId,
            AppUserId = coach.Id,
            HasClubRoleCoach = true
        };
        db.Members.Add(coachMember);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = _teamId, MemberId = coachMember.Id, IsCoach = true });

        var otherCoach = new AppUser
        {
            UserName = _otherCoachEmail,
            Email = _otherCoachEmail,
            FirstName = "Other",
            LastName = "Coach",
            DefaultClubId = _otherClubId
        };
        (await um.CreateAsync(otherCoach, TestPassword)).Succeeded.Should().BeTrue();
        db.Members.Add(new Member
        {
            FirstName = "Other",
            LastName = "Coach",
            Email = _otherCoachEmail,
            BirthYear = 1991,
            ClubId = _otherClubId,
            AppUserId = otherCoach.Id,
            HasClubRoleCoach = true
        });

        var player = new AppUser
        {
            UserName = _playerEmail,
            Email = _playerEmail,
            FirstName = "Goal",
            LastName = "Player",
            DefaultClubId = _clubId
        };
        (await um.CreateAsync(player, TestPassword)).Succeeded.Should().BeTrue();
        var playerMember = new Member
        {
            FirstName = "Goal",
            LastName = "Player",
            Email = _playerEmail,
            BirthYear = 2005,
            ClubId = _clubId,
            AppUserId = player.Id
        };
        var playerMember2 = new Member
        {
            FirstName = "Goal",
            LastName = "PlayerTwo",
            BirthYear = 2006,
            ClubId = _clubId
        };
        db.Members.AddRange(playerMember, playerMember2);
        await db.SaveChangesAsync();
        _memberId1 = playerMember.Id;
        _memberId2 = playerMember2.Id;
        db.TeamMembers.AddRange(
            new TeamMember { TeamId = _teamId, MemberId = playerMember.Id, IsPlayer = true },
            new TeamMember { TeamId = _teamId, MemberId = playerMember2.Id, IsPlayer = true });

        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();
        var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        db.SeasonGoals.RemoveRange(db.SeasonGoals.Where(g => g.TeamId == _teamId));
        db.StatTrackerEntries.RemoveRange(
            db.StatTrackerEntries.Where(e => e.StatTracker!.TeamId == _teamId));
        db.StatTrackerParticipants.RemoveRange(
            db.StatTrackerParticipants.Where(p => p.StatTracker!.TeamId == _teamId));
        await db.SaveChangesAsync();
        db.StatTrackers.RemoveRange(db.StatTrackers.Where(s => s.TeamId == _teamId));
        db.TestResults.RemoveRange(
            db.TestResults.Where(r => r.Member != null && r.Member.ClubId == _clubId));
        await db.SaveChangesAsync();

        db.TestDefinitions.RemoveRange(db.TestDefinitions.Where(td => td.ClubId == _clubId));
        db.TeamMembers.RemoveRange(db.TeamMembers.Where(tm => tm.TeamId == _teamId));
        db.XpEvents.RemoveRange(db.XpEvents.Where(e => e.MemberId == _memberId1 || e.MemberId == _memberId2));
        db.MemberBadges.RemoveRange(db.MemberBadges.Where(b => b.MemberId == _memberId1 || b.MemberId == _memberId2));
        db.MemberRewardClaims.RemoveRange(
            db.MemberRewardClaims.Where(c => c.MemberId == _memberId1 || c.MemberId == _memberId2));
        await db.SaveChangesAsync();
        db.ClubRewards.RemoveRange(db.ClubRewards.Where(r => r.ClubId == _clubId));
        await db.SaveChangesAsync();

        db.Teams.RemoveRange(db.Teams.Where(t => t.Id == _teamId));
        db.Members.RemoveRange(db.Members.Where(m => m.ClubId == _clubId || m.ClubId == _otherClubId));
        await db.SaveChangesAsync();

        db.Seasons.RemoveRange(db.Seasons.Where(s => s.Id == _seasonId));
        db.Clubs.RemoveRange(db.Clubs.Where(c => c.Id == _clubId || c.Id == _otherClubId));
        await db.SaveChangesAsync();

        foreach (var email in new[] { _coachEmail, _otherCoachEmail, _playerEmail })
        {
            var user = await um.FindByEmailAsync(email);
            if (user != null) await um.DeleteAsync(user);
        }
    }

    private async Task<HttpClient> CreateClientAsync(string email)
    {
        var client = _factory.CreateClient();
        var token = await LoginHelper.GetTokenAsync(client, email, TestPassword);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);
        return client;
    }

    private SeasonGoalInputDto NewGoal(SeasonGoalMetric metric, double target,
        SeasonGoalDirection dir = SeasonGoalDirection.AtLeast) => new()
    {
        SeasonId = _seasonId,
        TeamId = _teamId,
        Metric = metric,
        Direction = dir,
        Target = target
    };

    private async Task<SeasonGoalDto> CreateAsync(HttpClient client, SeasonGoalInputDto dto)
    {
        var response = await client.PostAsJsonAsync("/SeasonGoals", dto);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<SeasonGoalDto>())!;
    }

    private async Task<TeamSeasonGoalsDto> GetTeamGoalsAsync(HttpClient client) =>
        (await client.GetFromJsonAsync<TeamSeasonGoalsDto>($"/SeasonGoals/team/{_teamId}"))!;

    /// <summary>Seed <paramref name="wins"/> won + <paramref name="losses"/> lost match trackers in the season.</summary>
    private async Task SeedMatchesAsync(int wins, int losses)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
        await using var db = await dbFactory.CreateDbContextAsync();

        void AddMatch(int home, int away)
        {
            var tracker = new StatTracker
            {
                EventCategory = 0,
                TeamId = _teamId,
                SeasonId = _seasonId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Participants = [new StatTrackerParticipant { MemberId = _memberId1, Role = 0, SortOrder = 0 }],
                Entries = Enumerable.Range(0, home)
                    .Select(_ => new StatTrackerEntry { Kind = 1, Delta = 1, CreatedAt = DateTime.UtcNow })
                    .Concat(Enumerable.Range(0, away)
                        .Select(_ => new StatTrackerEntry { Kind = 2, Delta = 1, CreatedAt = DateTime.UtcNow }))
                    .ToList()
            };
            db.StatTrackers.Add(tracker);
        }

        for (var i = 0; i < wins; i++) AddMatch(5, 2);
        for (var i = 0; i < losses; i++) AddMatch(1, 4);
        await db.SaveChangesAsync();
    }

    // ── CRUD ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Coach_can_create_update_and_delete_a_goal()
    {
        var client = await CreateClientAsync(_coachEmail);

        var goal = await CreateAsync(client, NewGoal(SeasonGoalMetric.Wins, 12));
        goal.Id.Should().BePositive();
        goal.Metric.Should().Be(SeasonGoalMetric.Wins);

        var listed = await GetTeamGoalsAsync(client);
        listed.Goals.Should().ContainSingle(g => g.Id == goal.Id);
        listed.TotalCount.Should().Be(1);
        listed.CanManage.Should().BeTrue();

        var input = NewGoal(SeasonGoalMetric.Wins, 8);
        input.Note = "Upravený cíl";
        var updateResponse = await client.PutAsJsonAsync($"/SeasonGoals/{goal.Id}", input);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        (await updateResponse.Content.ReadFromJsonAsync<SeasonGoalDto>())!.Target.Should().Be(8);

        (await client.DeleteAsync($"/SeasonGoals/{goal.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await GetTeamGoalsAsync(client)).Goals.Should().BeEmpty();
    }

    [Fact]
    public async Task Test_metric_requires_a_test_definition()
    {
        var client = await CreateClientAsync(_coachEmail);
        (await client.PostAsJsonAsync("/SeasonGoals", NewGoal(SeasonGoalMetric.TestTeamAverage, 3.2)))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Progress computation ────────────────────────────────────────────────

    [Fact]
    public async Task Wins_goal_counts_won_match_trackers()
    {
        await SeedMatchesAsync(wins: 2, losses: 1);
        var client = await CreateClientAsync(_coachEmail);

        var reached = await CreateAsync(client, NewGoal(SeasonGoalMetric.Wins, 2));
        var missed = await CreateAsync(client, NewGoal(SeasonGoalMetric.Wins, 5));
        var lossCap = await CreateAsync(client,
            NewGoal(SeasonGoalMetric.Losses, 1, SeasonGoalDirection.AtMost));

        var view = await GetTeamGoalsAsync(client);
        var reachedDto = view.Goals.Single(g => g.Id == reached.Id);
        reachedDto.CurrentValue.Should().Be(2);
        reachedDto.Achieved.Should().BeTrue();

        var missedDto = view.Goals.Single(g => g.Id == missed.Id);
        missedDto.CurrentValue.Should().Be(2);
        missedDto.Achieved.Should().BeFalse();
        missedDto.ProgressPercent.Should().BeApproximately(40, 0.1);

        view.Goals.Single(g => g.Id == lossCap.Id).Achieved.Should().BeTrue(); // 1 loss <= 1
    }

    [Fact]
    public async Task Manual_progress_goal_tracks_its_manual_value()
    {
        var client = await CreateClientAsync(_coachEmail);

        var input = NewGoal(SeasonGoalMetric.ManualProgress, 5);
        input.ManualValue = 3;
        input.Note = "Dvoufázové tréninky";
        var goal = await CreateAsync(client, input);
        goal.Note.Should().Be("Dvoufázové tréninky");
        goal.Achieved.Should().BeFalse();
        goal.ProgressPercent.Should().BeApproximately(60, 0.1);

        input.ManualValue = 5;
        var done = await client.PutAsJsonAsync($"/SeasonGoals/{goal.Id}", input);
        (await done.Content.ReadFromJsonAsync<SeasonGoalDto>())!.Achieved.Should().BeTrue();
    }

    [Fact]
    public async Task Manual_goal_requires_a_name()
    {
        var client = await CreateClientAsync(_coachEmail);

        (await client.PostAsJsonAsync("/SeasonGoals", NewGoal(SeasonGoalMetric.ManualDone, 1)))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var named = NewGoal(SeasonGoalMetric.ManualDone, 1);
        named.Note = "Zavést pravidelný videorozbor";
        named.ManualValue = 0;
        (await CreateAsync(client, named)).Note.Should().Be("Zavést pravidelný videorozbor");
    }

    // ── Verdict ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Verdict_is_successful_when_every_goal_is_met_and_override_wins()
    {
        await SeedMatchesAsync(wins: 3, losses: 0);
        var client = await CreateClientAsync(_coachEmail);
        await CreateAsync(client, NewGoal(SeasonGoalMetric.Wins, 2)); // 3 >= 2 → met

        var derived = await GetTeamGoalsAsync(client);
        derived.Verdict.Should().Be(SeasonVerdict.Successful);
        derived.VerdictOverridden.Should().BeFalse();

        // Coach overrides to unsuccessful
        (await client.PutAsJsonAsync($"/SeasonGoals/team/{_teamId}/verdict",
                new { seasonId = _seasonId, successful = false, note = "Nesplnili jsme herní projev" }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var overridden = await GetTeamGoalsAsync(client);
        overridden.Verdict.Should().Be(SeasonVerdict.Unsuccessful);
        overridden.VerdictOverridden.Should().BeTrue();
        overridden.OverrideNote.Should().Be("Nesplnili jsme herní projev");
        overridden.Goals.Should().ContainSingle(); // the override row is not a goal
        overridden.TotalCount.Should().Be(1);

        // Clearing the override returns to the derived verdict
        (await client.PutAsJsonAsync($"/SeasonGoals/team/{_teamId}/verdict",
                new { seasonId = _seasonId, successful = (bool?)null, note = (string?)null }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await GetTeamGoalsAsync(client)).Verdict.Should().Be(SeasonVerdict.Successful);
    }

    // ── Month-by-month + season-total report ──────────────────────────────────

    [Fact]
    public async Task Report_buckets_scoring_badges_rewards_and_xp_level_by_month_and_totals_the_season()
    {
        var matchDate = new DateTime(2020, 9, 15);
        const int xpPoints = 150; // XpProgression.Career(150) => rank index 1 ("Hráč")
        int clubRewardId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            var tracker = new StatTracker
            {
                EventCategory = 0, TeamId = _teamId, SeasonId = _seasonId,
                CreatedAt = matchDate, UpdatedAt = matchDate,
            };
            db.StatTrackers.Add(tracker);
            await db.SaveChangesAsync();
            var participant = new StatTrackerParticipant { StatTrackerId = tracker.Id, MemberId = _memberId1 };
            var goalsMetric = new StatTrackerMetric { StatTrackerId = tracker.Id, Code = "goals", Name = "Góly" };
            db.StatTrackerParticipants.Add(participant);
            db.StatTrackerMetrics.Add(goalsMetric);
            await db.SaveChangesAsync();
            db.StatTrackerEntries.Add(new StatTrackerEntry
            {
                StatTrackerId = tracker.Id, Kind = 0, StatTrackerParticipantId = participant.Id,
                StatTrackerMetricId = goalsMetric.Id, Delta = 2, CreatedAt = matchDate,
            });

            db.XpEvents.Add(new XpEvent
            {
                MemberId = _memberId1, Type = XpEventType.TrainingAttendance, Points = xpPoints,
                SeasonId = _seasonId, SourceKind = XpSourceKind.Attendance, OccurredAt = matchDate,
            });
            db.MemberBadges.Add(new MemberBadge
            {
                MemberId = _memberId2, Code = BadgeCode.Attendance10, SeasonId = _seasonId, EarnedAt = matchDate,
            });
            var reward = new ClubReward
            {
                ClubId = _clubId, Name = "Test odměna",
                TriggerType = RewardTriggerType.XpThreshold, TriggerValue = "100",
            };
            db.ClubRewards.Add(reward);
            await db.SaveChangesAsync();
            clubRewardId = reward.Id;
            db.MemberRewardClaims.Add(new MemberRewardClaim
            {
                MemberId = _memberId1, ClubRewardId = clubRewardId, EarnedAt = matchDate,
            });
            await db.SaveChangesAsync();
        }

        var client = await CreateClientAsync(_coachEmail);
        var report = (await client.GetFromJsonAsync<TeamSeasonReportDto>($"/SeasonGoals/team/{_teamId}/report"))!;

        // Season Aug 2020 .. Jun 2021 = 11 elapsed calendar months.
        report.Months.Should().HaveCount(11);

        var expectedLevel = XpProgression.Career(xpPoints);
        var september = report.Months.Single(m => m.Label == "2020-09");
        september.TopScoring.Should().ContainSingle(r => r.MemberId == _memberId1 && r.Value == 2);
        september.TopXp.Should().ContainSingle(r =>
            r.MemberId == _memberId1 && r.Value == xpPoints &&
            r.LevelIndex == expectedLevel.RankIndex && r.LevelName == expectedLevel.Rank);
        september.TopBadges.Should().ContainSingle(r =>
            r.MemberId == _memberId2 && r.Code == nameof(BadgeCode.Attendance10) && r.Icon != "");
        september.TopRewards.Should().ContainSingle(r => r.MemberId == _memberId1 && r.Value == 1);

        var october = report.Months.Single(m => m.Label == "2020-10");
        october.TopScoring.Should().BeEmpty();
        october.TopXp.Should().BeEmpty();
        october.TopBadges.Should().BeEmpty();
        october.TopRewards.Should().BeEmpty();

        report.SeasonTotal.Should().NotBeNull();
        report.SeasonTotal!.TopScoring.Should().ContainSingle(r => r.MemberId == _memberId1 && r.Value == 2);
        report.SeasonTotal!.TopXp.Should().ContainSingle(r => r.MemberId == _memberId1 && r.LevelIndex == expectedLevel.RankIndex);
        report.SeasonTotal!.TopBadges.Should().ContainSingle(r => r.MemberId == _memberId2 && r.Code == nameof(BadgeCode.Attendance10));
        report.SeasonTotal!.TopRewards.Should().ContainSingle(r => r.MemberId == _memberId1 && r.Value == 1);

        var otherClient = await CreateClientAsync(_otherCoachEmail);
        (await otherClient.GetAsync($"/SeasonGoals/team/{_teamId}/report"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Report_shows_top_7_but_keeps_every_player_tied_for_7th_place()
    {
        var matchDate = new DateTime(2020, 9, 15);
        // 8 players, XP 100..30 stepping by 10, except the last three all tie at 50 —
        // a plain "top 7 by value" cutoff would arbitrarily drop one of the tied ones.
        int[] xpByRank = [100, 90, 80, 70, 60, 50, 50, 50];
        var extraMemberIds = new List<int>();

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            foreach (var xp in xpByRank)
            {
                var member = new Member
                {
                    FirstName = "Tie", LastName = $"Player{xp}-{Guid.NewGuid():N}", BirthYear = 2007, ClubId = _clubId,
                };
                db.Members.Add(member);
                await db.SaveChangesAsync();
                extraMemberIds.Add(member.Id);
                db.TeamMembers.Add(new TeamMember { TeamId = _teamId, MemberId = member.Id, IsPlayer = true });
                db.XpEvents.Add(new XpEvent
                {
                    MemberId = member.Id, Type = XpEventType.TrainingAttendance, Points = xp,
                    SeasonId = _seasonId, SourceKind = XpSourceKind.Attendance, OccurredAt = matchDate,
                });
            }
            await db.SaveChangesAsync();
        }

        try
        {
            var client = await CreateClientAsync(_coachEmail);
            var report = (await client.GetFromJsonAsync<TeamSeasonReportDto>($"/SeasonGoals/team/{_teamId}/report"))!;

            // All 8 survive: top 6 are strictly above the cutoff, and the 3-way tie at 50 for what
            // would be "7th place" is kept whole rather than arbitrarily dropping one of them.
            report.SeasonTotal!.TopXp.Should().HaveCount(8);
            report.SeasonTotal!.TopXp.Select(r => r.MemberId).Should().BeEquivalentTo(extraMemberIds);
            report.SeasonTotal!.TopXp.Where(r => r.Value == 50).Should().HaveCount(3);
        }
        finally
        {
            await using var scope = _factory.Services.CreateAsyncScope();
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();
            await using var db = await dbFactory.CreateDbContextAsync();
            db.XpEvents.RemoveRange(db.XpEvents.Where(e => extraMemberIds.Contains(e.MemberId)));
            db.TeamMembers.RemoveRange(db.TeamMembers.Where(tm => extraMemberIds.Contains(tm.MemberId)));
            await db.SaveChangesAsync();
            db.Members.RemoveRange(db.Members.Where(m => extraMemberIds.Contains(m.Id)));
            await db.SaveChangesAsync();
        }
    }

    // ── Club rollup ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Club_rollup_lists_the_team_with_its_counts()
    {
        await SeedMatchesAsync(wins: 1, losses: 0);
        var coachClient = await CreateClientAsync(_coachEmail);
        await CreateAsync(coachClient, NewGoal(SeasonGoalMetric.Wins, 5)); // not met

        var adminClient = _factory.CreateClient();
        var adminToken = await LoginHelper.GetAdminTokenAsync(adminClient);
        adminClient.DefaultRequestHeaders.Authorization = new("Bearer", adminToken);

        var rows = await adminClient.GetFromJsonAsync<List<ClubSeasonGoalRowDto>>(
            $"/SeasonGoals/club/{_clubId}?seasonId={_seasonId}");
        var row = rows!.Single(r => r.TeamId == _teamId);
        row.TotalCount.Should().Be(1);
        row.AchievedCount.Should().Be(0);
    }

    // ── Authorization ───────────────────────────────────────────────────────

    [Fact]
    public async Task Player_can_read_but_not_write()
    {
        var coachClient = await CreateClientAsync(_coachEmail);
        var goal = await CreateAsync(coachClient, NewGoal(SeasonGoalMetric.Wins, 10));

        var playerClient = await CreateClientAsync(_playerEmail);
        var view = await GetTeamGoalsAsync(playerClient);
        view.Goals.Should().ContainSingle(g => g.Id == goal.Id);
        view.CanManage.Should().BeFalse();

        (await playerClient.PostAsJsonAsync("/SeasonGoals", NewGoal(SeasonGoalMetric.Losses, 3)))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await playerClient.DeleteAsync($"/SeasonGoals/{goal.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        await coachClient.DeleteAsync($"/SeasonGoals/{goal.Id}");
    }

    [Fact]
    public async Task Coach_of_other_club_is_forbidden()
    {
        var client = await CreateClientAsync(_otherCoachEmail);
        (await client.GetAsync($"/SeasonGoals/team/{_teamId}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.PostAsJsonAsync("/SeasonGoals", NewGoal(SeasonGoalMetric.Wins, 5)))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await client.GetAsync($"/SeasonGoals/club/{_clubId}?seasonId={_seasonId}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Goals_require_authentication()
    {
        var client = _factory.CreateClient();
        (await client.GetAsync($"/SeasonGoals/team/{_teamId}"))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
