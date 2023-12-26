using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Places;

public interface IDeletePlaceUseCase
{
    Task ExecuteAsync(PlaceDto place);
}