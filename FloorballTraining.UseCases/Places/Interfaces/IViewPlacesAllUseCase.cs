using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Places;

public interface IViewPlacesAllUseCase
{
    Task<IReadOnlyList<PlaceDto>> ExecuteAsync();
}