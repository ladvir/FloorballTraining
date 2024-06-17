using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places
{
    public class DeletePlaceUseCase(IPlaceRepository placeRepository) : IDeletePlaceUseCase
    {
        public async Task ExecuteAsync(PlaceDto place)
        {
            await placeRepository.DeletePlaceAsync(place);
        }
    }
}
