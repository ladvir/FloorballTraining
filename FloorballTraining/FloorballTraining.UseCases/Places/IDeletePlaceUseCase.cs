using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Places;

public interface IDeletePlaceUseCase
{
    Task ExecuteAsync(Place place);
}