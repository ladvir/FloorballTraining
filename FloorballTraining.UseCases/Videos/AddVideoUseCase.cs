using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Videos.Interfaces;

namespace FloorballTraining.UseCases.Videos;

public class AddVideoUseCase(IVideoRepository videoRepository) : IAddVideoUseCase
{
    public async Task<VideoDto> ExecuteFileAsync(VideoOwnerType ownerType, int ownerId, string filePath, string? title, string? userId, string? thumbnailUrl = null)
    {
        var video = BuildOwnedVideo(ownerType, ownerId);
        video.VideoType = VideoType.UploadedFile;
        video.FilePath = filePath;
        video.Title = title;
        video.ThumbnailUrl = thumbnailUrl;
        video.CreatedByUserId = userId;
        video.CreatedAt = DateTime.UtcNow;

        var saved = await videoRepository.AddAsync(video);
        return saved.ToDto();
    }

    public async Task<VideoDto?> ExecuteLinkAsync(VideoOwnerType ownerType, int ownerId, string url, string? title, string? userId)
    {
        if (!VideoLinkClassifier.TryClassify(url, out var videoType, out var thumbnailUrl))
            return null;

        var video = BuildOwnedVideo(ownerType, ownerId);
        video.VideoType = videoType;
        video.Url = url;
        video.ThumbnailUrl = thumbnailUrl;
        video.Title = title;
        video.CreatedByUserId = userId;
        video.CreatedAt = DateTime.UtcNow;

        var saved = await videoRepository.AddAsync(video);
        return saved.ToDto();
    }

    private static Video BuildOwnedVideo(VideoOwnerType ownerType, int ownerId) => ownerType switch
    {
        VideoOwnerType.Activity => new Video { ActivityId = ownerId },
        VideoOwnerType.Training => new Video { TrainingId = ownerId },
        VideoOwnerType.Appointment => new Video { AppointmentId = ownerId },
        _ => throw new ArgumentOutOfRangeException(nameof(ownerType)),
    };
}
