using System.Security.Claims;
using FloorballTraining.API.Controllers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.UseCases.Trainings.Interfaces;
using FloorballTraining.UseCases.VideoAnnotations.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Training edit/delete authorization (drives the real <see cref="TrainingsController"/> with a
/// role principal):
/// - EDIT (CanModifyTrainingAsync): any coach-role user may edit their own training, an unclaimed
///   one, or one authored by a member of their own club — but not another club's.
/// - DELETE (CanDeleteTrainingAsync): stricter — Admin, or HeadCoach/ClubAdmin club-scoped; a
///   plain Coach never deletes, even a training they authored.
/// </summary>
[Collection("Api")]
public class TrainingPermissionTests(CustomWebApplicationFactory factory)
{
    private static TrainingsController Controller(IServiceProvider sp, string userId, bool admin = false)
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId) };
        if (admin) claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        return new TrainingsController(
            sp.GetRequiredService<IViewTrainingByIdUseCase>(),
            sp.GetRequiredService<IViewTrainingsUseCase>(),
            sp.GetRequiredService<IViewTrainingsAllUseCase>(),
            sp.GetRequiredService<IAddTrainingUseCase>(),
            sp.GetRequiredService<IEditTrainingUseCase>(),
            sp.GetRequiredService<IDeleteTrainingUseCase>(),
            sp.GetRequiredService<ICreatePdfUseCase<TrainingDto>>(),
            sp.GetRequiredService<IValidateTrainingUseCase>(),
            sp.GetRequiredService<IValidateAllTrainingsUseCase>(),
            sp.GetRequiredService<UserManager<AppUser>>(),
            sp.GetRequiredService<IClubRoleService>(),
            sp.GetRequiredService<ITrainingSimilarityService>(),
            sp.GetRequiredService<IAuditService>(),
            sp.GetRequiredService<IVideoUploadService>(),
            sp.GetRequiredService<IGetVideoAnnotationUseCase>(),
            sp.GetRequiredService<ISaveVideoAnnotationUseCase>(),
            sp.GetRequiredService<IVideoAnnotationExportService>(),
            sp.GetRequiredService<FloorballTrainingContext>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth")),
                },
            },
        };
    }

    private async Task<int> SeedClubAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var club = new Club { Name = $"TpClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        return club.Id;
    }

    private async Task<string> SeedCoachAsync(int clubId, bool headCoach = false)
    {
        var userId = Guid.NewGuid().ToString();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.Users.Add(new AppUser { Id = userId, UserName = $"u-{userId}", Email = $"{userId}@t.cz", FirstName = "Co", LastName = "Ch" });
        db.Members.Add(new Member
        {
            FirstName = "Co", LastName = "Ch", BirthYear = 1990, ClubId = clubId,
            AppUserId = userId, HasClubRoleCoach = !headCoach, HasClubRoleMainCoach = headCoach,
        });
        await db.SaveChangesAsync();
        return userId;
    }

    private async Task<int> SeedTrainingAsync(string authorUserId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var training = new Training
        {
            Name = $"TpTraining-{Guid.NewGuid():N}",
            Duration = 10,
            PersonsMin = 4,
            PersonsMax = 12,
            CreatedByUserId = authorUserId,
        };
        db.Trainings.Add(training);
        await db.SaveChangesAsync();
        return training.Id;
    }

    private async Task CleanupAsync(IEnumerable<int> clubIds, IEnumerable<int> trainingIds)
    {
        var clubs = clubIds.ToList();
        var trainings = trainingIds.ToList();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.Trainings.RemoveRange(db.Trainings.Where(t => trainings.Contains(t.Id)));
        var userIds = await db.Members.Where(m => clubs.Contains(m.ClubId) && m.AppUserId != null)
            .Select(m => m.AppUserId!).ToListAsync();
        db.Members.RemoveRange(db.Members.Where(m => clubs.Contains(m.ClubId)));
        db.Users.RemoveRange(db.Users.Where(u => userIds.Contains(u.Id)));
        db.Clubs.RemoveRange(db.Clubs.Where(c => clubs.Contains(c.Id)));
        await db.SaveChangesAsync();
    }

    private static async Task<IActionResult> EditAsync(IServiceProvider sp, TrainingsController controller, int trainingId)
    {
        var existing = await sp.GetRequiredService<IViewTrainingByIdUseCase>().ExecuteAsync(trainingId);
        return await controller.Update(trainingId, existing!);
    }

    [Fact]
    public async Task Coach_MayEditOwnTraining_ButNotDelete()
    {
        var clubId = await SeedClubAsync();
        var coachId = await SeedCoachAsync(clubId);
        var trainingId = await SeedTrainingAsync(coachId);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var controller = Controller(scope.ServiceProvider, coachId);

            (await EditAsync(scope.ServiceProvider, controller, trainingId))
                .Should().BeOfType<NoContentResult>("the author may edit their own training");
            (await controller.Delete(trainingId))
                .Should().BeOfType<ForbidResult>("a plain Coach may not delete, even their own training");
        }
        finally { await CleanupAsync([clubId], [trainingId]); }
    }

    [Fact]
    public async Task Coach_MayEditSameClubColleaguesTraining()
    {
        var clubId = await SeedClubAsync();
        var authorId = await SeedCoachAsync(clubId);
        var otherCoachId = await SeedCoachAsync(clubId);
        var trainingId = await SeedTrainingAsync(authorId);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var controller = Controller(scope.ServiceProvider, otherCoachId);

            (await EditAsync(scope.ServiceProvider, controller, trainingId))
                .Should().BeOfType<NoContentResult>("a coach may edit a training authored by a fellow club member");
        }
        finally { await CleanupAsync([clubId], [trainingId]); }
    }

    [Fact]
    public async Task Coach_CannotEditOrDeleteOtherClubTraining()
    {
        var clubA = await SeedClubAsync();
        var clubB = await SeedClubAsync();
        var authorId = await SeedCoachAsync(clubA);
        var outsiderId = await SeedCoachAsync(clubB);
        var trainingId = await SeedTrainingAsync(authorId);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var controller = Controller(scope.ServiceProvider, outsiderId);

            (await EditAsync(scope.ServiceProvider, controller, trainingId))
                .Should().BeOfType<ForbidResult>("a coach may not edit another club's training");
            (await controller.Delete(trainingId))
                .Should().BeOfType<ForbidResult>("nor delete it");
        }
        finally { await CleanupAsync([clubA, clubB], [trainingId]); }
    }

    [Fact]
    public async Task HeadCoach_MayDeleteSameClubTraining()
    {
        var clubId = await SeedClubAsync();
        var authorId = await SeedCoachAsync(clubId);
        var headCoachId = await SeedCoachAsync(clubId, headCoach: true);
        var trainingId = await SeedTrainingAsync(authorId);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var controller = Controller(scope.ServiceProvider, headCoachId);

            (await controller.Delete(trainingId))
                .Should().BeOfType<NoContentResult>("a HeadCoach may delete a training authored within their club");
        }
        finally { await CleanupAsync([clubId], [trainingId]); }
    }

    [Fact]
    public async Task Admin_MayDeleteTraining()
    {
        var clubId = await SeedClubAsync();
        var coachId = await SeedCoachAsync(clubId);
        var trainingId = await SeedTrainingAsync(coachId);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var controller = Controller(scope.ServiceProvider, Guid.NewGuid().ToString(), admin: true);

            (await controller.Delete(trainingId))
                .Should().BeOfType<NoContentResult>("Admin may delete any training");
        }
        finally { await CleanupAsync([clubId], [trainingId]); }
    }
}
