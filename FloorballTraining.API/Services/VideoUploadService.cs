using FloorballTraining.API.Helpers;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.Videos.Interfaces;
using Microsoft.AspNetCore.Http;

namespace FloorballTraining.API.Services;

public enum VideoUploadStatus { Success, Empty, TooLarge, UnsupportedType, InvalidUrl }

public record VideoUploadResult(VideoUploadStatus Status, VideoDto? Video);

/// <summary>
/// Shared add/delete logic for the video endpoints on Activities/Trainings/Appointments —
/// validates+stores the file (or classifies the link) and delegates persistence to the
/// use cases, parametrized by owner type so it isn't duplicated per controller (#127).
/// </summary>
public interface IVideoUploadService
{
    Task<VideoUploadResult> AddFileAsync(VideoOwnerType ownerType, int ownerId, IFormFile? file, string? title, string? userId);
    Task<VideoUploadResult> AddLinkAsync(VideoOwnerType ownerType, int ownerId, string? url, string? title, string? userId);

    /// <summary>Deletes the DB row and, for uploaded files, the physical file. Null if not found for this owner.</summary>
    Task<VideoDto?> DeleteAsync(int videoId, VideoOwnerType ownerType, int ownerId);
}

public class VideoUploadService(
    IVideoFileStorage fileStorage,
    IAddVideoUseCase addVideoUseCase,
    IDeleteVideoUseCase deleteVideoUseCase) : IVideoUploadService
{
    private static readonly IReadOnlySet<string> VideoExtensions =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".mp4", ".webm" };

    private static readonly IReadOnlySet<string> VideoContentTypes = new HashSet<string>
    {
        "video/mp4", "video/webm"
    };

    // mp4: 4-byte box size then "ftyp" box type at offset 4. webm: EBML header at offset 0.
    private static readonly IReadOnlyList<(int Offset, byte[] Signature)> VideoSignatures =
    [
        (4, "ftyp"u8.ToArray()),
        (0, new byte[] { 0x1A, 0x45, 0xDF, 0xA3 }),
    ];

    public async Task<VideoUploadResult> AddFileAsync(VideoOwnerType ownerType, int ownerId, IFormFile? file, string? title, string? userId)
    {
        var validation = FileUploadValidator.Validate(file, fileStorage.MaxBytes, VideoExtensions, VideoContentTypes, VideoSignatures);
        if (validation != FileValidationResult.Valid)
            return new VideoUploadResult(MapStatus(validation), null);

        var relativePath = await fileStorage.SaveAsync(file!, ownerType, ownerId);
        var video = await addVideoUseCase.ExecuteFileAsync(ownerType, ownerId, relativePath, title, userId);
        return new VideoUploadResult(VideoUploadStatus.Success, video);
    }

    public async Task<VideoUploadResult> AddLinkAsync(VideoOwnerType ownerType, int ownerId, string? url, string? title, string? userId)
    {
        if (string.IsNullOrWhiteSpace(url))
            return new VideoUploadResult(VideoUploadStatus.InvalidUrl, null);

        var video = await addVideoUseCase.ExecuteLinkAsync(ownerType, ownerId, url, title, userId);
        return video == null
            ? new VideoUploadResult(VideoUploadStatus.InvalidUrl, null)
            : new VideoUploadResult(VideoUploadStatus.Success, video);
    }

    public async Task<VideoDto?> DeleteAsync(int videoId, VideoOwnerType ownerType, int ownerId)
    {
        var deleted = await deleteVideoUseCase.ExecuteAsync(videoId, ownerType, ownerId);
        if (deleted is { VideoType: VideoType.UploadedFile, FilePath: not null })
            fileStorage.Delete(deleted.FilePath);
        return deleted;
    }

    private static VideoUploadStatus MapStatus(FileValidationResult result) => result switch
    {
        FileValidationResult.Empty => VideoUploadStatus.Empty,
        FileValidationResult.TooLarge => VideoUploadStatus.TooLarge,
        _ => VideoUploadStatus.UnsupportedType,
    };
}
