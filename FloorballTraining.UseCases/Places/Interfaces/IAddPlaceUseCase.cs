using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Places.Interfaces;

public interface IAddPlaceUseCase
{
    Task ExecuteAsync(PlaceDto place);
}