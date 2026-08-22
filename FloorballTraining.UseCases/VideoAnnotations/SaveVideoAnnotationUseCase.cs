using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.VideoAnnotations.Interfaces;

namespace FloorballTraining.UseCases.VideoAnnotations;

public class SaveVideoAnnotationUseCase(IVideoRepository videoRepository, IVideoAnnotationRepository annotationRepository) : ISaveVideoAnnotationUseCase
{
    public async Task<VideoAnnotationDto?> ExecuteAsync(
        int videoId,
        VideoOwnerType ownerType,
        int ownerId,
        int? trimStartMs,
        int? trimEndMs,
        string dataJson,
        string? userId)
    {
        var video = await videoRepository.GetByIdAsync(videoId);
        if (video == null || !BelongsTo(video, ownerType, ownerId)) return null;

        var saved = await annotationRepository.UpsertAsync(videoId, trimStartMs, trimEndMs, dataJson, userId);
        return saved.ToDto();
    }

    private static bool BelongsTo(Video video, VideoOwnerType ownerType, int ownerId) => ownerType switch
    {
        VideoOwnerType.Activity => video.ActivityId == ownerId,
        VideoOwnerType.Training => video.TrainingId == ownerId,
        VideoOwnerType.Appointment => video.AppointmentId == ownerId,
        _ => false,
    };
}
