using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.VideoAnnotations.Interfaces;

public interface ISaveVideoAnnotationUseCase
{
    /// <summary>Null when the video doesn't belong to this owner.</summary>
    Task<VideoAnnotationDto?> ExecuteAsync(
        int videoId,
        VideoOwnerType ownerType,
        int ownerId,
        int? trimStartMs,
        int? trimEndMs,
        string dataJson,
        string? userId);
}
