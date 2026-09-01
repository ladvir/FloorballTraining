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
/// A Coach listed as the club's author of a training may EDIT it but not DELETE it — deletion is
/// reserved for Admin / HeadCoach / ClubAdmin (club-scoped). Drives the real
/// <see cref="TrainingsController"/> with a role principal. See CanDeleteTrainingAsync.
/// </summary>
[Collection("Api")]
public class TrainingDeletePermissionTests(CustomWebApplicationFactory factory)
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

    /// <summary>Seeds a club + an AppUser/Member with the given club role, plus one training authored by them.</summary>
    private async Task<(int clubId, string userId, int trainingId)> SeedAuthoredTrainingAsync(
        bool coach = false, bool headCoach = false)
    {
        var userId = Guid.NewGuid().ToString();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();

        var club = new Club { Name = $"TdpClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();

        db.Users.Add(new AppUser { Id = userId, UserName = $"u-{userId}", Email = $"{userId}@t.cz", FirstName = "Tr", LastName = "Ee" });
        db.Members.Add(new Member
        {
            FirstName = "Tr", LastName = "Ee", BirthYear = 1990, ClubId = club.Id,
            AppUserId = userId, HasClubRoleCoach = coach, HasClubRoleMainCoach = headCoach,
        });

        var training = new Training
        {
            Name = $"TdpTraining-{Guid.NewGuid():N}",
            Duration = 10,
            PersonsMin = 4,
            PersonsMax = 12,
            CreatedByUserId = userId,
        };
        db.Trainings.Add(training);
        await db.SaveChangesAsync();

        return (club.Id, userId, training.Id);
    }

    private async Task CleanupAsync(int clubId, string userId, int trainingId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.Trainings.RemoveRange(db.Trainings.Where(t => t.Id == trainingId));
        db.Members.RemoveRange(db.Members.Where(m => m.ClubId == clubId));
        db.Users.RemoveRange(db.Users.Where(u => u.Id == userId));
        db.Clubs.RemoveRange(db.Clubs.Where(c => c.Id == clubId));
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Coach_MayEditOwnTraining_ButNotDelete()
    {
        var (clubId, userId, trainingId) = await SeedAuthoredTrainingAsync(coach: true);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var controller = Controller(scope.ServiceProvider, userId);
            var existing = await scope.ServiceProvider.GetRequiredService<IViewTrainingByIdUseCase>().ExecuteAsync(trainingId);

            var edit = await controller.Update(trainingId, existing!);
            edit.Should().BeOfType<NoContentResult>("the training's author may still edit it");

            var delete = await controller.Delete(trainingId);
            delete.Should().BeOfType<ForbidResult>("a plain Coach may not delete a training, even one they authored");
        }
        finally
        {
            await CleanupAsync(clubId, userId, trainingId);
        }
    }

    [Fact]
    public async Task HeadCoach_MayDeleteOwnClubTraining()
    {
        var (clubId, userId, trainingId) = await SeedAuthoredTrainingAsync(headCoach: true);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var controller = Controller(scope.ServiceProvider, userId);

            var delete = await controller.Delete(trainingId);
            delete.Should().BeOfType<NoContentResult>("a HeadCoach may delete a training authored within their club");
        }
        finally
        {
            await CleanupAsync(clubId, userId, trainingId);
        }
    }

    [Fact]
    public async Task Admin_MayDeleteTraining()
    {
        var (clubId, userId, trainingId) = await SeedAuthoredTrainingAsync(coach: true);
        try
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var controller = Controller(scope.ServiceProvider, Guid.NewGuid().ToString(), admin: true);

            var delete = await controller.Delete(trainingId);
            delete.Should().BeOfType<NoContentResult>("Admin may delete any training");
        }
        finally
        {
            await CleanupAsync(clubId, userId, trainingId);
        }
    }
}
