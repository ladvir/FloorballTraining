using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Places;

public interface IViewPlaceByIdUseCase
{
    Task<PlaceDto> ExecuteAsync(int placeId);
}