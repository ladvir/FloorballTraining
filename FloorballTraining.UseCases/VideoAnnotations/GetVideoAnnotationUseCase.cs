using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.VideoAnnotations.Interfaces;

namespace FloorballTraining.UseCases.VideoAnnotations;

public class GetVideoAnnotationUseCase(IVideoRepository videoRepository, IVideoAnnotationRepository annotationRepository) : IGetVideoAnnotationUseCase
{
    public async Task<VideoAnnotationDto?> ExecuteAsync(int videoId, VideoOwnerType ownerType, int ownerId)
    {
        var video = await videoRepository.GetByIdAsync(videoId);
        if (video == null || !BelongsTo(video, ownerType, ownerId)) return null;

        var annotation = await annotationRepository.GetByVideoIdAsync(videoId);
        return annotation?.ToDto();
    }

    private static bool BelongsTo(Video video, VideoOwnerType ownerType, int ownerId) => ownerType switch
    {
        VideoOwnerType.Activity => video.ActivityId == ownerId,
        VideoOwnerType.Training => video.TrainingId == ownerId,
        VideoOwnerType.Appointment => video.AppointmentId == ownerId,
        _ => false,
    };
}
