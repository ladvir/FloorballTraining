using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.VideoAnnotations.Interfaces;

public interface IGetVideoAnnotationUseCase
{
    /// <summary>Null when the video doesn't belong to this owner, or no analysis was saved yet.</summary>
    Task<VideoAnnotationDto?> ExecuteAsync(int videoId, VideoOwnerType ownerType, int ownerId);
}
