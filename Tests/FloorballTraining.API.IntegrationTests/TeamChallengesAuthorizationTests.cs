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
/// #156 authorization + lifecycle: a team's coach can CRUD team challenges and toggle a manual one for the
/// whole roster; a role-less club member and a coach from another club cannot. Manual complete/undo writes
/// and prunes the roster's completion rows and their bonus XP (verified via an inline recompute).
/// </summary>
[Collection("Api")]
public class TeamChallengesAuthorizationTests(CustomWebApplicationFactory factory)
{
    private static TeamChallengesController Controller(IServiceProvider sp, string userId)
    {
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId)], "TestAuth"));
        return new TeamChallengesController(
            sp.GetRequiredService<FloorballTrainingContext>(),
            sp.GetRequiredService<IClubRoleService>(),
            sp.GetRequiredService<IAuditService>(),
            sp.GetRequiredService<TeamChallengeService>(),
            sp.GetRequiredService<XpService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } },
        };
    }

    private async Task<(int clubId, int teamId)> SeedClubTeamAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var club = new Club { Name = $"TcAuthClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        var team = new Team { Name = $"TcAuthTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return (club.Id, team.Id);
    }

    private async Task<string> SeedMemberAsync(int clubId, bool asCoach)
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

    private async Task<int> SeedPlayerAsync(int clubId, int teamId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var p = new Member { FirstName = "Pl", LastName = $"Ayer{Guid.NewGuid():N}"[..8], BirthYear = 2010, ClubId = clubId };
        db.Members.Add(p);
        await db.SaveChangesAsync();
        db.TeamMembers.Add(new TeamMember { TeamId = teamId, MemberId = p.Id, IsPlayer = true });
        await db.SaveChangesAsync();
        return p.Id;
    }

    private static SaveTeamChallengeDto DerivedDto(int teamId) => new()
    {
        TeamId = teamId, Name = "Týmová docházka", IsManual = false,
        Metric = nameof(ChallengeMetric.TrainingAttendance), Target = 10,
        Window = nameof(TeamChallengeWindow.Month), RewardXp = 40, IsActive = true,
    };

    [Fact]
    public async Task Coach_CanCreateEditListDelete_TeamChallenge()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var coach = await SeedMemberAsync(clubId, asCoach: true);

        int id;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var res = await Controller(scope.ServiceProvider, coach).Create(DerivedDto(teamId), CancellationToken.None);
            var dto = res.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<TeamChallengeDto>().Subject;
            dto.CanManage.Should().BeTrue();
            dto.TeamId.Should().Be(teamId);
            id = dto.Id;
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var edit = DerivedDto(teamId);
            edit.Target = 20;
            var res = await Controller(scope.ServiceProvider, coach).Update(id, edit, CancellationToken.None);
            res.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<TeamChallengeDto>()
                .Subject.Target.Should().Be(20);
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var res = await Controller(scope.ServiceProvider, coach).List(teamId, CancellationToken.None);
            var board = res.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<TeamChallengeListDto>().Subject;
            board.CanManage.Should().BeTrue();
            board.Challenges.Should().ContainSingle(c => c.Id == id).Which.CanManage.Should().BeTrue();
        }

        await using (var scope = factory.Services.CreateAsyncScope())
            (await Controller(scope.ServiceProvider, coach).Delete(id, CancellationToken.None))
                .Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task NonCoachClubMember_CannotCreate()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var plain = await SeedMemberAsync(clubId, asCoach: false);

        await using var scope = factory.Services.CreateAsyncScope();
        (await Controller(scope.ServiceProvider, plain).Create(DerivedDto(teamId), CancellationToken.None))
            .Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task CoachFromAnotherClub_CannotManageOrSee()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var (otherClubId, _) = await SeedClubTeamAsync();
        var outsider = await SeedMemberAsync(otherClubId, asCoach: true);

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = Controller(scope.ServiceProvider, outsider);
        (await controller.Create(DerivedDto(teamId), CancellationToken.None)).Should().BeOfType<ForbidResult>();
        (await controller.List(teamId, CancellationToken.None)).Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Manual_CompleteThenUndo_TogglesRosterCompletionsAndBonusXp()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var coach = await SeedMemberAsync(clubId, asCoach: true);
        var p1 = await SeedPlayerAsync(clubId, teamId);
        var p2 = await SeedPlayerAsync(clubId, teamId);

        int id;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dto = new SaveTeamChallengeDto
            {
                TeamId = teamId, Name = "Vyhrát turnaj", IsManual = true,
                Window = nameof(TeamChallengeWindow.Season), RewardXp = 60, IsActive = true,
            };
            var res = await Controller(scope.ServiceProvider, coach).Create(dto, CancellationToken.None);
            id = res.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<TeamChallengeDto>().Subject.Id;
        }

        await using (var scope = factory.Services.CreateAsyncScope())
            (await Controller(scope.ServiceProvider, coach).Complete(id, CancellationToken.None))
                .Should().BeOfType<OkObjectResult>();

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
            var comps = await db.TeamChallengeCompletions.AsNoTracking().Where(c => c.TeamChallengeId == id).ToListAsync();
            comps.Should().HaveCount(2);
            comps.Should().OnlyContain(c => c.CompletedByUserId != null && c.PeriodKey == "MANUAL");
        }

        await RecomputeAsync();
        await AssertBonusXpCountAsync(new[] { p1, p2 }, expected: 2, points: 60);

        await using (var scope = factory.Services.CreateAsyncScope())
            (await Controller(scope.ServiceProvider, coach).Uncomplete(id, CancellationToken.None))
                .Should().BeOfType<NoContentResult>();

        await RecomputeAsync();
        await AssertBonusXpCountAsync(new[] { p1, p2 }, expected: 0, points: 60);
    }

    private async Task RecomputeAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<TeamChallengeService>().RecomputeAllAsync();
        await scope.ServiceProvider.GetRequiredService<XpService>().RecomputeAllAsync();
    }

    private async Task AssertBonusXpCountAsync(int[] memberIds, int expected, int points)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var events = await db.XpEvents.AsNoTracking()
            .Where(e => memberIds.Contains(e.MemberId) && e.Type == XpEventType.TeamChallengeReward)
            .ToListAsync();
        events.Count.Should().Be(expected);
        if (expected > 0) events.Should().OnlyContain(e => e.Points == points);
    }
}
