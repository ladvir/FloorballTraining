using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Videos.Interfaces;

namespace FloorballTraining.UseCases.Videos;

public class DeleteVideoUseCase(IVideoRepository videoRepository) : IDeleteVideoUseCase
{
    public async Task<VideoDto?> ExecuteAsync(int videoId, VideoOwnerType ownerType, int ownerId)
    {
        var video = await videoRepository.GetByIdAsync(videoId);
        if (video == null || !BelongsTo(video, ownerType, ownerId)) return null;

        await videoRepository.DeleteAsync(video);
        return video.ToDto();
    }

    private static bool BelongsTo(Video video, VideoOwnerType ownerType, int ownerId) => ownerType switch
    {
        VideoOwnerType.Activity => video.ActivityId == ownerId,
        VideoOwnerType.Training => video.TrainingId == ownerId,
        VideoOwnerType.Appointment => video.AppointmentId == ownerId,
        _ => false,
    };
}
