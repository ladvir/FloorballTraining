using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Places;

public interface IEditPlaceUseCase
{
    Task ExecuteAsync(Place place);
}