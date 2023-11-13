using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Places;

public interface IViewPlaceByIdUseCase
{
    Task<Place> ExecuteAsync(int placeId);
}