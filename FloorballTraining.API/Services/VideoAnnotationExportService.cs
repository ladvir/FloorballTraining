using FloorballTraining.API.Jobs;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using Hangfire;

namespace FloorballTraining.API.Services;

/// <summary>
/// Kicks off a burned-in video export (#141) — validates there's something to export, marks it
/// Processing, and hands the actual ffmpeg/rendering work to a Hangfire job so the HTTP request
/// returns immediately.
/// </summary>
public interface IVideoAnnotationExportService
{
    /// <summary>False when there's no saved annotation for this video yet.</summary>
    Task<bool> EnqueueExportAsync(int videoId, VideoOwnerType ownerType, int ownerId);
}

public class VideoAnnotationExportService(
    IVideoRepository videoRepository,
    IVideoAnnotationRepository annotationRepository) : IVideoAnnotationExportService
{
    public async Task<bool> EnqueueExportAsync(int videoId, VideoOwnerType ownerType, int ownerId)
    {
        var video = await videoRepository.GetByIdAsync(videoId);
        if (video == null || !BelongsTo(video, ownerType, ownerId)) return false;

        var annotation = await annotationRepository.GetByVideoIdAsync(videoId);
        if (annotation == null) return false;

        // A double-click while one export is already running just no-ops instead of piling up
        // duplicate renders - not a full distributed lock, but enough for a single coach's button.
        if (annotation.ExportStatus == VideoExportStatus.Processing) return true;

        await annotationRepository.SetExportStatusAsync(annotation.Id, VideoExportStatus.Processing, null, null);
        BackgroundJob.Enqueue<VideoAnnotationExportJob>(job => job.RunAsync(annotation.Id, CancellationToken.None));
        return true;
    }

    private static bool BelongsTo(CoreBusiness.Video video, VideoOwnerType ownerType, int ownerId) => ownerType switch
    {
        VideoOwnerType.Activity => video.ActivityId == ownerId,
        VideoOwnerType.Training => video.TrainingId == ownerId,
        VideoOwnerType.Appointment => video.AppointmentId == ownerId,
        _ => false,
    };
}
