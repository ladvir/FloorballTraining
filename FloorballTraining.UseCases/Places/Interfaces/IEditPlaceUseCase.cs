using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Places;

public interface IEditPlaceUseCase
{
    Task ExecuteAsync(PlaceDto place);
}