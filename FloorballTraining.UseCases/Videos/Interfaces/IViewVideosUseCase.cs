using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.UseCases.Videos.Interfaces;

public interface IViewVideosUseCase
{
    Task<List<VideoDto>> ExecuteAsync(VideoOwnerType ownerType, int ownerId);
}
