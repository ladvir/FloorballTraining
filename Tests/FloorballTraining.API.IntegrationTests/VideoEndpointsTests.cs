using System.Security.Claims;
using FloorballTraining.API.Controllers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Appointments;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.UseCases.Trainings.Interfaces;
using FloorballTraining.API.Controllers.Requests;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// #127: upload/link/delete video endpoints on Activities/Trainings/Appointments, all backed by
/// the same VideoUploadService + AddVideoUseCase/DeleteVideoUseCase. Uses a FakeVideoFileStorage
/// (no real disk I/O — VideoFileStorageTests already covers the real one) so these tests focus on
/// controller wiring: authorization reuse, validation rejection, and DB persistence.
/// </summary>
[Collection("Api")]
public class VideoEndpointsTests(CustomWebApplicationFactory factory)
{
    private static ClaimsPrincipal Principal(string userId)
        => new(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId)], "TestAuth"));

    private static IFormFile Mp4File(string fileName = "clip.mp4")
    {
        byte[] bytes = [0x00, 0x00, 0x00, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p', 0x69, 0x73, 0x6F, 0x6D];
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = "video/mp4",
        };
    }

    private static IFormFile JpegFile(string fileName = "thumb.jpg")
    {
        byte[] bytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "thumbnail", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/jpeg",
        };
    }

    private sealed class FakeVideoFileStorage : IVideoFileStorage
    {
        public long MaxBytes { get; set; } = 200L * 1024 * 1024;
        public List<string> Saved { get; } = [];
        public List<string> Deleted { get; } = [];

        public Task<string> SaveAsync(IFormFile file, VideoOwnerType ownerType, int ownerId)
        {
            var path = $"videos/{ownerType.ToString().ToLowerInvariant()}/{ownerId}/{Guid.NewGuid():N}.mp4";
            Saved.Add(path);
            return Task.FromResult(path);
        }

        public Task<string> AdoptGeneratedFileAsync(string sourceFilePath, string extension, VideoOwnerType ownerType, int ownerId)
        {
            var path = $"videos/{ownerType.ToString().ToLowerInvariant()}/{ownerId}/{Guid.NewGuid():N}{extension}";
            Saved.Add(path);
            return Task.FromResult(path);
        }

        public void Delete(string relativePath) => Deleted.Add(relativePath);
    }

    private static IVideoUploadService VideoService(IServiceProvider sp, FakeVideoFileStorage storage) => new VideoUploadService(
        storage,
        sp.GetRequiredService<UseCases.Videos.Interfaces.IAddVideoUseCase>(),
        sp.GetRequiredService<UseCases.Videos.Interfaces.IDeleteVideoUseCase>(),
        sp.GetRequiredService<UseCases.Videos.Interfaces.IViewVideosUseCase>());

    private static ActivitiesController ActivityController(IServiceProvider sp, string userId, IVideoUploadService videoService) => new(
        sp.GetRequiredService<IViewActivityByIdUseCase>(),
        sp.GetRequiredService<IViewActivitiesUseCase>(),
        sp.GetRequiredService<IViewActivitiesAllUseCase>(),
        sp.GetRequiredService<IAddActivityUseCase>(),
        sp.GetRequiredService<IEditActivityUseCase>(),
        sp.GetRequiredService<IDeleteActivityUseCase>(),
        sp.GetRequiredService<IValidateActivityUseCase>(),
        sp.GetRequiredService<IValidateAllActivitiesUseCase>(),
        sp.GetRequiredService<ICreatePdfUseCase<ActivityDto>>(),
        sp.GetRequiredService<UseCases.PluginInterfaces.IActivityRepository>(),
        sp.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AppUser>>(),
        sp.GetRequiredService<IClubRoleService>(),
        sp.GetRequiredService<IAuditService>(),
        videoService,
        sp.GetRequiredService<UseCases.VideoAnnotations.Interfaces.IGetVideoAnnotationUseCase>(),
        sp.GetRequiredService<UseCases.VideoAnnotations.Interfaces.ISaveVideoAnnotationUseCase>(),
        sp.GetRequiredService<IVideoAnnotationExportService>(),
        sp.GetRequiredService<FloorballTrainingContext>())
    { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = Principal(userId) } } };

    private static TrainingsController TrainingController(IServiceProvider sp, string userId, IVideoUploadService videoService) => new(
        sp.GetRequiredService<IViewTrainingByIdUseCase>(),
        sp.GetRequiredService<IViewTrainingsUseCase>(),
        sp.GetRequiredService<IViewTrainingsAllUseCase>(),
        sp.GetRequiredService<IAddTrainingUseCase>(),
        sp.GetRequiredService<IEditTrainingUseCase>(),
        sp.GetRequiredService<IDeleteTrainingUseCase>(),
        sp.GetRequiredService<ICreatePdfUseCase<TrainingDto>>(),
        sp.GetRequiredService<IValidateTrainingUseCase>(),
        sp.GetRequiredService<IValidateAllTrainingsUseCase>(),
        sp.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AppUser>>(),
        sp.GetRequiredService<IClubRoleService>(),
        sp.GetRequiredService<ITrainingSimilarityService>(),
        sp.GetRequiredService<IAuditService>(),
        videoService,
        sp.GetRequiredService<UseCases.VideoAnnotations.Interfaces.IGetVideoAnnotationUseCase>(),
        sp.GetRequiredService<UseCases.VideoAnnotations.Interfaces.ISaveVideoAnnotationUseCase>(),
        sp.GetRequiredService<IVideoAnnotationExportService>(),
        sp.GetRequiredService<FloorballTrainingContext>())
    { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = Principal(userId) } } };

    private static AppointmentsController AppointmentController(IServiceProvider sp, string userId, IVideoUploadService videoService) => new(
        sp.GetRequiredService<IViewAppointmentsUseCase>(),
        sp.GetRequiredService<IViewAppointmentByIdUseCase>(),
        sp.GetRequiredService<IAddAppointmentUseCase>(),
        sp.GetRequiredService<IEditAppointmentUseCase>(),
        sp.GetRequiredService<IDeleteAppointmentUseCase>(),
        sp.GetRequiredService<FloorballTraining.Services.IAppointmentService>(),
        sp.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AppUser>>(),
        sp.GetRequiredService<IClubRoleService>(),
        sp.GetRequiredService<IAuditService>(),
        sp.GetRequiredService<INotificationService>(),
        sp.GetRequiredService<Microsoft.AspNetCore.SignalR.IHubContext<FloorballTraining.API.Hubs.NotificationHub>>(),
        videoService,
        sp.GetRequiredService<UseCases.VideoAnnotations.Interfaces.IGetVideoAnnotationUseCase>(),
        sp.GetRequiredService<UseCases.VideoAnnotations.Interfaces.ISaveVideoAnnotationUseCase>(),
        sp.GetRequiredService<IVideoAnnotationExportService>(),
        sp.GetRequiredService<FloorballTrainingContext>())
    { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = Principal(userId) } } };

    private async Task<(int clubId, int teamId)> SeedClubTeamAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var club = new Club { Name = $"VidClub-{Guid.NewGuid():N}" };
        db.Clubs.Add(club);
        await db.SaveChangesAsync();
        var team = new Team { Name = $"VidTeam-{Guid.NewGuid():N}", ClubId = club.Id, AgeGroupId = 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return (club.Id, team.Id);
    }

    private async Task<string> SeedMemberAsync(int clubId, bool asCoach)
    {
        var userId = Guid.NewGuid().ToString();
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        db.Users.Add(new AppUser { Id = userId, UserName = $"u-{userId}", Email = $"{userId}@t.cz", FirstName = "Vi", LastName = "Deo" });
        db.Members.Add(new Member
        {
            FirstName = "Vi", LastName = "Deo", BirthYear = 1990, ClubId = clubId,
            AppUserId = userId, HasClubRoleCoach = asCoach,
        });
        await db.SaveChangesAsync();
        return userId;
    }

    private async Task<int> SeedActivityAsync(string authorUserId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var activity = new Activity { Name = $"VidActivity-{Guid.NewGuid():N}", IsDraft = false, CreatedByUserId = authorUserId };
        db.Activities.Add(activity);
        await db.SaveChangesAsync();
        return activity.Id;
    }

    private async Task<int> SeedTrainingAsync(string authorUserId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var training = new Training { Name = $"VidTraining-{Guid.NewGuid():N}", Duration = 60, CreatedByUserId = authorUserId };
        db.Trainings.Add(training);
        await db.SaveChangesAsync();
        return training.Id;
    }

    private async Task<int> SeedAppointmentAsync(int teamId, string ownerUserId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        var appt = new Appointment
        {
            AppointmentType = AppointmentType.Training, Start = DateTime.UtcNow, End = DateTime.UtcNow.AddHours(1),
            LocationId = 1, TeamId = teamId, OwnerUserId = ownerUserId,
        };
        db.Appointments.Add(appt);
        await db.SaveChangesAsync();
        return appt.Id;
    }

    [Fact]
    public async Task Activity_author_can_upload_link_and_delete_video()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(activityId, Mp4File(), "Nahrávka");
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;
        uploaded.VideoType.Should().Be(VideoType.UploadedFile);
        storage.Saved.Should().ContainSingle();

        var linkResult = await controller.AddVideoLink(activityId, new AddVideoLinkRequest { Url = "https://youtu.be/abc123", Title = "YT" });
        var linked = linkResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;
        linked.VideoType.Should().Be(VideoType.YouTube);
        linked.ThumbnailUrl.Should().Be("https://img.youtube.com/vi/abc123/hqdefault.jpg");

        (await controller.DeleteVideo(activityId, uploaded.Id)).Should().BeOfType<NoContentResult>();
        (await controller.DeleteVideo(activityId, linked.Id)).Should().BeOfType<NoContentResult>();
        storage.Deleted.Should().Equal(storage.Saved);

        var db = scope.ServiceProvider.GetRequiredService<FloorballTrainingContext>();
        (await db.Videos.CountAsync(v => v.ActivityId == activityId)).Should().Be(0);
    }

    [Fact]
    public async Task AddVideoFile_with_thumbnail_sets_ThumbnailUrl_and_deletes_it_alongside_the_video()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(activityId, Mp4File(), null, JpegFile());
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        uploaded.ThumbnailUrl.Should().NotBeNullOrEmpty();
        storage.Saved.Should().HaveCount(2);

        (await controller.DeleteVideo(activityId, uploaded.Id)).Should().BeOfType<NoContentResult>();
        storage.Deleted.Should().Equal(storage.Saved);
    }

    [Fact]
    public async Task AddVideoFile_ignores_an_invalid_thumbnail_without_failing_the_upload()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var badThumbnail = Mp4File("not-a-thumbnail.mp4"); // wrong type for the thumbnail slot
        var uploadResult = await controller.AddVideoFile(activityId, Mp4File(), null, badThumbnail);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        uploaded.ThumbnailUrl.Should().BeNullOrEmpty();
        storage.Saved.Should().ContainSingle();
    }

    [Fact]
    public async Task Training_author_can_upload_link_and_delete_video()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var trainingId = await SeedTrainingAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = TrainingController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(trainingId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        (await controller.DeleteVideo(trainingId, uploaded.Id)).Should().BeOfType<NoContentResult>();
        storage.Deleted.Should().ContainSingle();
    }

    [Fact]
    public async Task Appointment_owner_can_upload_link_and_delete_video()
    {
        var (clubId, teamId) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var appointmentId = await SeedAppointmentAsync(teamId, coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = AppointmentController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var linkResult = await controller.AddVideoLink(appointmentId, new AddVideoLinkRequest { Url = "https://www.instagram.com/reel/xyz/" });
        var linked = linkResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;
        linked.VideoType.Should().Be(VideoType.Instagram);

        (await controller.DeleteVideo(appointmentId, linked.Id)).Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task AddVideoFile_rejects_wrong_file_type()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, new FakeVideoFileStorage()));

        byte[] jpegBytes = [0xFF, 0xD8, 0xFF, 0xE0];
        var jpeg = new FormFile(new MemoryStream(jpegBytes), 0, jpegBytes.Length, "file", "clip.mp4")
        {
            Headers = new HeaderDictionary(),
            ContentType = "video/mp4",
        };

        var result = await controller.AddVideoFile(activityId, jpeg, null);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AddVideoFile_rejects_file_larger_than_configured_max()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage { MaxBytes = 4 };

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var result = await controller.AddVideoFile(activityId, Mp4File(), null);

        result.Should().BeOfType<ObjectResult>().Subject.StatusCode.Should().Be(StatusCodes.Status413PayloadTooLarge);
    }

    [Fact]
    public async Task AddVideoLink_rejects_invalid_url()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, new FakeVideoFileStorage()));

        var result = await controller.AddVideoLink(activityId, new AddVideoLinkRequest { Url = "not a url" });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Plain_club_member_without_role_is_forbidden_to_add_video()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var plainUserId = await SeedMemberAsync(clubId, asCoach: false);
        var activityId = await SeedActivityAsync(coachUserId);

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, plainUserId, VideoService(scope.ServiceProvider, new FakeVideoFileStorage()));

        var result = await controller.AddVideoLink(activityId, new AddVideoLinkRequest { Url = "https://youtu.be/abc123" });

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task DeleteVideo_returns_NotFound_when_video_belongs_to_a_different_owner()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);
        var otherActivityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(activityId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        var deleteViaWrongOwner = await controller.DeleteVideo(otherActivityId, uploaded.Id);

        deleteViaWrongOwner.Should().BeOfType<NotFoundResult>();
        storage.Deleted.Should().BeEmpty();
    }

    // ── Video analysis (#137) ───────────────────────────────────────────────────

    [Fact]
    public async Task GetVideoAnnotation_returns_NoContent_when_nothing_saved_yet()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(activityId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        (await controller.GetVideoAnnotation(activityId, uploaded.Id)).Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task SaveVideoAnnotation_then_GetVideoAnnotation_roundtrips()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var trainingId = await SeedTrainingAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = TrainingController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(trainingId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        var request = new SaveVideoAnnotationRequest { TrimStartMs = 500, TrimEndMs = 4000, DataJson = "{\"lines\":[]}" };
        var saveResult = await controller.SaveVideoAnnotation(trainingId, uploaded.Id, request);
        var saved = saveResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoAnnotationDto>().Subject;
        saved.TrimStartMs.Should().Be(500);
        saved.DataJson.Should().Be("{\"lines\":[]}");

        var getResult = await controller.GetVideoAnnotation(trainingId, uploaded.Id);
        var loaded = getResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoAnnotationDto>().Subject;
        loaded.TrimEndMs.Should().Be(4000);

        // Saving again updates the same row rather than creating a second one.
        var secondSave = await controller.SaveVideoAnnotation(
            trainingId, uploaded.Id, new SaveVideoAnnotationRequest { DataJson = "{\"lines\":[1]}" });
        secondSave.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoAnnotationDto>()
            .Subject.Id.Should().Be(saved.Id);
    }

    [Fact]
    public async Task SaveVideoAnnotation_returns_NotFound_when_video_belongs_to_a_different_owner()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);
        var otherActivityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(activityId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        var result = await controller.SaveVideoAnnotation(
            otherActivityId, uploaded.Id, new SaveVideoAnnotationRequest { DataJson = "{}" });

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task SaveVideoAnnotation_forbidden_for_plain_club_member()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var plainUserId = await SeedMemberAsync(clubId, asCoach: false);
        var activityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var coachController = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));
        var uploadResult = await coachController.AddVideoFile(activityId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        var plainController = ActivityController(scope.ServiceProvider, plainUserId, VideoService(scope.ServiceProvider, storage));
        var result = await plainController.SaveVideoAnnotation(
            activityId, uploaded.Id, new SaveVideoAnnotationRequest { DataJson = "{}" });

        result.Should().BeOfType<ForbidResult>();
    }

    // ── Video export (#141) ─────────────────────────────────────────────────────
    // Only the synchronous enqueue contract is asserted here - the actual render runs on a real
    // Hangfire worker in this test host, and these fake uploads aren't real video files, so its
    // eventual Completed/Failed outcome is not something these tests can assert deterministically.

    [Fact]
    public async Task ExportVideoAnnotation_returns_NotFound_when_no_annotation_saved_yet()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var activityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(activityId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;

        (await controller.ExportVideoAnnotation(activityId, uploaded.Id)).Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task ExportVideoAnnotation_accepted_once_an_annotation_is_saved()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var trainingId = await SeedTrainingAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var controller = TrainingController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));

        var uploadResult = await controller.AddVideoFile(trainingId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;
        await controller.SaveVideoAnnotation(trainingId, uploaded.Id, new SaveVideoAnnotationRequest { DataJson = "{\"lines\":[]}" });

        (await controller.ExportVideoAnnotation(trainingId, uploaded.Id)).Should().BeOfType<AcceptedResult>();
    }

    [Fact]
    public async Task ExportVideoAnnotation_forbidden_for_plain_club_member()
    {
        var (clubId, _) = await SeedClubTeamAsync();
        var coachUserId = await SeedMemberAsync(clubId, asCoach: true);
        var plainUserId = await SeedMemberAsync(clubId, asCoach: false);
        var activityId = await SeedActivityAsync(coachUserId);
        var storage = new FakeVideoFileStorage();

        await using var scope = factory.Services.CreateAsyncScope();
        var coachController = ActivityController(scope.ServiceProvider, coachUserId, VideoService(scope.ServiceProvider, storage));
        var uploadResult = await coachController.AddVideoFile(activityId, Mp4File(), null);
        var uploaded = uploadResult.Should().BeOfType<OkObjectResult>().Subject.Value.Should().BeOfType<VideoDto>().Subject;
        await coachController.SaveVideoAnnotation(activityId, uploaded.Id, new SaveVideoAnnotationRequest { DataJson = "{}" });

        var plainController = ActivityController(scope.ServiceProvider, plainUserId, VideoService(scope.ServiceProvider, storage));
        var result = await plainController.ExportVideoAnnotation(activityId, uploaded.Id);

        result.Should().BeOfType<ForbidResult>();
    }
}
