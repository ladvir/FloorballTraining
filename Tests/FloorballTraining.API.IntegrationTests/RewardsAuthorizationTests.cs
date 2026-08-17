using System.Security.Claims;
using FloorballTraining.API.Controllers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// #105 authorization: a team's coach must be able to DEFINE and HAND OVER (fulfill) team rewards.
/// Drives the real <see cref="RewardsController"/> with a coach principal — proving the role gate,
/// including that a coach known only via the club-level HasClubRoleCoach flag (empty CoachTeamIds)
/// is allowed. A role-less club member is forbidden (negative case).
/// </summary>
[Collection("Api")]
public class RewardsAuthorizationTests(CustomWebApplicationFactory factory)
{
    private static RewardsController Controller(IServiceProvider sp, string userId)
    {
        var db = sp.GetRequiredService<FloorballTrainingContext>();
        var clubRoles = sp.GetRequiredService<IClubRoleService>();
        var rewards = sp.GetRequiredService<RewardService>();
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId)], "TestAuth"));
        return new RewardsController(db, clubRoles, rewards)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } },
        };
    }

    private async Task<(int clubId, int teamId)> SeedClubTeamAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var club = new Club { Name = $"RwAuthClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        var team = new Team { Name = $"RwAuthTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return (club.Id, team.Id);
    }

    private async Task<string> SeedCoachAsync(int clubId, bool asCoach)
    {
        var userId = Guid.NewGuid().ToString();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.Users.Add(new AppUser { Id = userId, UserName = $"u-{userId}", Email = $"{userId}@t.cz", FirstName = "Co", LastName = "Ach" });
        db.Members.Add(new Member
        {
            FirstName = "Co", LastName = "Ach", BirthYear = 1990, ClubId = clubId,
            AppUserId = userId, HasClubRoleCoach = asCoach,
        });
        await db.SaveChangesAsync();
        return userId;
    }

    [Fact]
    public async Task Coach_CanDefineAndFulfill_TeamReward()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var coachUserId = await SeedCoachAsync(clubId, asCoach: true);

        // Define a team reward as the coach → must be allowed (Ok, not Forbid).
        int rewardId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var result = await Controller(scope.ServiceProvider, coachUserId).Create(new SaveClubRewardDto
            {
                ClubId = clubId, TeamId = teamId, Name = "Nášivka",
                TriggerType = nameof(RewardTriggerType.XpThreshold), TriggerValue = "1", IsActive = true,
            }, CancellationToken.None);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var dto = ok.Value.Should().BeOfType<ClubRewardDto>().Subject;
            dto.TeamId.Should().Be(teamId);
            dto.CanManage.Should().BeTrue();
            rewardId = dto.Id;
        }

        // Seed a player + an eligible claim, then hand it over (fulfill) as the coach.
        int claimId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var player = new Member { FirstName = "Pl", LastName = "Ayer", BirthYear = 2010, ClubId = clubId };
            db.Members.Add(player);
            await db.SaveChangesAsync();
            db.TeamMembers.Add(new TeamMember { TeamId = teamId, MemberId = player.Id, IsPlayer = true });
            var claim = new MemberRewardClaim { MemberId = player.Id, ClubRewardId = rewardId };
            db.MemberRewardClaims.Add(claim);
            await db.SaveChangesAsync();
            claimId = claim.Id;
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var result = await Controller(scope.ServiceProvider, coachUserId).Fulfill(claimId, CancellationToken.None);
            result.Should().BeOfType<OkObjectResult>();
        }

        await using (var check = factory.Services.CreateAsyncScope())
        {
            var db = check.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            (await db.MemberRewardClaims.FirstAsync(c => c.Id == claimId)).Status.Should().Be(RewardClaimStatus.Fulfilled);
        }
    }

    [Fact]
    public async Task Coach_DefinesReward_QualifyingPlayerGetsClaimAndCanBeHandedOver()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var coachUserId = await SeedCoachAsync(clubId, asCoach: true);

        // A player on the team with 300 lifetime XP.
        int playerId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var player = new Member { FirstName = "Pl", LastName = "Ayer", BirthYear = 2010, ClubId = clubId };
            db.Members.Add(player);
            await db.SaveChangesAsync();
            db.TeamMembers.Add(new TeamMember { TeamId = teamId, MemberId = player.Id, IsPlayer = true });
            for (var i = 0; i < 3; i++)
                db.XpEvents.Add(new XpEvent
                {
                    MemberId = player.Id, Type = XpEventType.TrainingAttendance, Points = 100,
                    SourceKind = XpSourceKind.Attendance, SourceId = 80000 + i, OccurredAt = DateTime.UtcNow,
                });
            await db.SaveChangesAsync();
            playerId = player.Id;
        }

        // Coach defines a team reward with an XP threshold the player meets — the claim is created
        // synchronously (not only via the async recompute), so the coach sees it right away.
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var result = await Controller(scope.ServiceProvider, coachUserId).Create(new SaveClubRewardDto
            {
                ClubId = clubId, TeamId = teamId, Name = "Camp day",
                TriggerType = nameof(RewardTriggerType.XpThreshold), TriggerValue = "100", IsActive = true,
            }, CancellationToken.None);

            var dto = result.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<ClubRewardDto>().Subject;
            dto.ClaimCount.Should().Be(1);
        }

        // The grants list shows the claim and the coach can hand it over (mark předáno).
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var controller = Controller(scope.ServiceProvider, coachUserId);
            var claimsResult = await controller.Claims(null, teamId, CancellationToken.None);
            var claims = claimsResult.Should().BeOfType<OkObjectResult>()
                .Subject.Value.Should().BeAssignableTo<List<MemberRewardClaimDto>>().Subject;
            claims.Should().ContainSingle(c => c.MemberId == playerId);
            claims[0].CanFulfill.Should().BeTrue();

            (await controller.Fulfill(claims[0].Id, CancellationToken.None)).Should().BeOfType<OkObjectResult>();
        }
    }

    [Fact]
    public async Task NonCoach_CannotDefine_TeamReward()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var plainUserId = await SeedCoachAsync(clubId, asCoach: false); // club member, no role

        await using var scope = factory.Services.CreateAsyncScope();
        var result = await Controller(scope.ServiceProvider, plainUserId).Create(new SaveClubRewardDto
        {
            ClubId = clubId, TeamId = teamId, Name = "Nope",
            TriggerType = nameof(RewardTriggerType.XpThreshold), TriggerValue = "1", IsActive = true,
        }, CancellationToken.None);

        result.Should().BeOfType<ForbidResult>();
    }
}
