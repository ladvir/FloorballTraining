using System.Security.Claims;
using FloorballTraining.API.Controllers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// A Coach may edit an activity whose author is a member of a team they coach (not just their
/// own). An activity authored by an unrelated club member stays off-limits. Drives the real
/// <see cref="ActivitiesController"/> with a coach principal. See CanModifyActivityAsync.
/// </summary>
[Collection("Api")]
public class ActivityEditPermissionTests(CustomWebApplicationFactory factory)
{
    private static ActivitiesController Controller(IServiceProvider sp, string userId) => new(
        sp.GetRequiredService<IViewActivityByIdUseCase>(),
        sp.GetRequiredService<IViewActivitiesUseCase>(),
        sp.GetRequiredService<IViewActivitiesAllUseCase>(),
        sp.GetRequiredService<IAddActivityUseCase>(),
        sp.GetRequiredService<IEditActivityUseCase>(),
        sp.GetRequiredService<IDeleteActivityUseCase>(),
        sp.GetRequiredService<IValidateActivityUseCase>(),
        sp.GetRequiredService<IValidateAllActivitiesUseCase>(),
        sp.GetRequiredService<ICreatePdfUseCase<ActivityDto>>(),
        sp.GetRequiredService<IActivityRepository>(),
        sp.GetRequiredService<UserManager<AppUser>>(),
        sp.GetRequiredService<IClubRoleService>(),
        sp.GetRequiredService<IAuditService>(),
        sp.GetRequiredService<IVideoUploadService>(),
        sp.GetRequiredService<UseCases.VideoAnnotations.Interfaces.IGetVideoAnnotationUseCase>(),
        sp.GetRequiredService<UseCases.VideoAnnotations.Interfaces.ISaveVideoAnnotationUseCase>(),
        sp.GetRequiredService<IVideoAnnotationExportService>(),
        sp.GetRequiredService<FloorballTrainingContext>())
    {
        ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId)], "TestAuth")),
            },
        },
    };

    private async Task<(int clubId, int teamId)> SeedClubTeamAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var club = new Club { Name = $"ActPermClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        var team = new Team { Name = $"ActPermTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return (club.Id, team.Id);
    }

    /// <summary>Creates an AppUser + club Member; optionally puts them on <paramref name="teamId"/>.</summary>
    private async Task<string> SeedMemberAsync(int clubId, bool coachRole = false, int? teamId = null, bool asCoachOfTeam = false)
    {
        var userId = Guid.NewGuid().ToString();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.Users.Add(new AppUser { Id = userId, UserName = $"u-{userId}", Email = $"{userId}@t.cz", FirstName = "Ac", LastName = "Tor" });
        var member = new Member
        {
            FirstName = "Ac", LastName = "Tor", BirthYear = 1990, ClubId = clubId,
            AppUserId = userId, HasClubRoleCoach = coachRole,
        };
        db.Members.Add(member);
        await db.SaveChangesAsync();
        if (teamId.HasValue)
        {
            db.TeamMembers.Add(new TeamMember
            {
                TeamId = teamId.Value, MemberId = member.Id,
                IsCoach = asCoachOfTeam, IsPlayer = !asCoachOfTeam,
            });
            await db.SaveChangesAsync();
        }
        return userId;
    }

    private async Task<int> SeedActivityAsync(string authorUserId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var activity = new Activity { Name = $"ActPerm-{Guid.NewGuid():N}", IsDraft = false, CreatedByUserId = authorUserId };
        db.Activities.Add(activity);
        await db.SaveChangesAsync();
        return activity.Id;
    }

    private static ActivityDto EditDto(int id) => new()
    {
        Id = id, Name = "Upraveno", Environment = "Anywhere",
        DurationMin = 1, DurationMax = 10, PersonsMin = 1, PersonsMax = 6,
    };

    [Fact]
    public async Task Coach_can_edit_activity_authored_by_a_member_of_their_team()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, coachRole: true, teamId: teamId, asCoachOfTeam: true);
        var playerUserId = await SeedMemberAsync(clubId, teamId: teamId);
        var activityId = await SeedActivityAsync(playerUserId);

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = Controller(scope.ServiceProvider, coachUserId);

        (await controller.Update(activityId, EditDto(activityId))).Should().BeOfType<NoContentResult>();
        (await controller.Get(activityId))!.CanEdit.Should().BeTrue();
    }

    [Fact]
    public async Task Coach_cannot_edit_activity_authored_by_an_unrelated_club_member()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, coachRole: true, teamId: teamId, asCoachOfTeam: true);
        var strangerUserId = await SeedMemberAsync(clubId); // same club, no shared team
        var activityId = await SeedActivityAsync(strangerUserId);

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = Controller(scope.ServiceProvider, coachUserId);

        (await controller.Update(activityId, EditDto(activityId))).Should().BeOfType<ForbidResult>();
        (await controller.Get(activityId))!.CanEdit.Should().BeFalse();
    }
}
