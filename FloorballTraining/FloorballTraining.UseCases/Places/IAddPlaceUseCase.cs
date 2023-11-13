using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Places;

public interface IAddPlaceUseCase
{
    Task ExecuteAsync(Place place);
}