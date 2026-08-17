using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Real-world reward eligibility (#105): the service turns rank/XP/badge state into idempotent
/// <see cref="MemberRewardClaim"/> rows. Covers club-wide vs. team-scoped reach, the three trigger
/// types, that non-players/non-qualifiers earn nothing, and idempotence on a second run.
/// </summary>
[Collection("Api")]
public class RewardDerivationTests(CustomWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly DateTime _now = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);

    private int _playerAId;   // in team A, has the badge + 600 XP
    private int _playerBId;   // in team B, has the badge, no XP
    private int _clubBadgeRewardId;
    private int _teamBadgeRewardId;
    private int _xpRewardId;

    public async Task InitializeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"RewardClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();

        var teamA = new Team { Name = $"RwTeamA-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        var teamB = new Team { Name = $"RwTeamB-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.AddRange(teamA, teamB);
        var playerA = new Member { FirstName = "Rew", LastName = "AchieverA", BirthYear = 2010, ClubId = club.Id };
        var playerB = new Member { FirstName = "Rew", LastName = "AchieverB", BirthYear = 2010, ClubId = club.Id };
        db.Members.AddRange(playerA, playerB);
        await db.SaveChangesAsync();
        _playerAId = playerA.Id;
        _playerBId = playerB.Id;

        db.TeamMembers.AddRange(
            new TeamMember { TeamId = teamA.Id, MemberId = playerA.Id, IsPlayer = true },
            new TeamMember { TeamId = teamB.Id, MemberId = playerB.Id, IsPlayer = true });

        // Both players earn the Attendance10 badge (the badge-trigger source of truth).
        db.MemberBadges.AddRange(
            new MemberBadge { MemberId = playerA.Id, Code = BadgeCode.Attendance10, EarnedAt = _now },
            new MemberBadge { MemberId = playerB.Id, Code = BadgeCode.Attendance10, EarnedAt = _now });

        // Player A also has 600 lifetime (non-home) XP; player B has none.
        for (var i = 0; i < 6; i++)
            db.XpEvents.Add(new XpEvent
            {
                MemberId = playerA.Id, Type = XpEventType.TrainingAttendance, Points = 100,
                SourceKind = XpSourceKind.Attendance, SourceId = 90000 + i, OccurredAt = _now
            });

        // Three rewards: club-wide badge, team-A badge, club-wide XP≥500.
        var clubBadge = new ClubReward { ClubId = club.Id, Name = "Patch", TriggerType = RewardTriggerType.BadgeEarned, TriggerValue = nameof(BadgeCode.Attendance10), IsActive = true };
        var teamBadge = new ClubReward { ClubId = club.Id, TeamId = teamA.Id, Name = "Team patch", TriggerType = RewardTriggerType.BadgeEarned, TriggerValue = nameof(BadgeCode.Attendance10), IsActive = true };
        var xpReward = new ClubReward { ClubId = club.Id, Name = "Camp day", TriggerType = RewardTriggerType.XpThreshold, TriggerValue = "500", IsActive = true };
        db.ClubRewards.AddRange(clubBadge, teamBadge, xpReward);
        await db.SaveChangesAsync();
        _clubBadgeRewardId = clubBadge.Id;
        _teamBadgeRewardId = teamBadge.Id;
        _xpRewardId = xpReward.Id;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<List<int>> ClaimedRewardIdsOf(int memberId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        return await db.MemberRewardClaims.AsNoTracking()
            .Where(c => c.MemberId == memberId)
            .Select(c => c.ClubRewardId)
            .ToListAsync();
    }

    [Fact]
    public async Task Recompute_CreatesScopedClaims_AndIsIdempotent()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var svc = scope.ServiceProvider.GetRequiredService<RewardService>();

        await svc.RecomputeAllAsync();

        // Player A: club badge + team-A badge + XP threshold.
        var aClaims = await ClaimedRewardIdsOf(_playerAId);
        aClaims.Should().BeEquivalentTo(new[] { _clubBadgeRewardId, _teamBadgeRewardId, _xpRewardId });

        // Player B: only the club-wide badge (not team A's, no XP).
        var bClaims = await ClaimedRewardIdsOf(_playerBId);
        bClaims.Should().BeEquivalentTo(new[] { _clubBadgeRewardId });

        // Idempotence: re-running with no new state awards nothing.
        (await svc.RecomputeAllAsync()).Should().Be(0);
        (await ClaimedRewardIdsOf(_playerAId)).Should().HaveCount(3);
        (await ClaimedRewardIdsOf(_playerBId)).Should().HaveCount(1);
    }
}
