using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.Videos.Interfaces;

public interface IDeleteVideoUseCase
{
    /// <summary>Deletes the DB row and returns it. Null if not found or owned by a different owner.</summary>
    Task<VideoDto?> ExecuteAsync(int videoId, VideoOwnerType ownerType, int ownerId);
}
