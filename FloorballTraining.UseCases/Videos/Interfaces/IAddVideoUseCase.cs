using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.Videos.Interfaces;

public interface IAddVideoUseCase
{
    Task<VideoDto> ExecuteFileAsync(VideoOwnerType ownerType, int ownerId, string filePath, string? title, string? userId, string? thumbnailUrl = null);

    /// <summary>Null return means the URL isn't a valid absolute http(s) URL.</summary>
    Task<VideoDto?> ExecuteLinkAsync(VideoOwnerType ownerType, int ownerId, string url, string? title, string? userId);
}
