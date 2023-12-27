using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places
{
    public class DeletePlaceUseCase : IDeletePlaceUseCase
    {
        private readonly IPlaceRepository _placeRepository;

        public DeletePlaceUseCase(IPlaceRepository placeRepository)
        {
            _placeRepository = placeRepository;
        }

        public async Task ExecuteAsync(PlaceDto place)
        {
            await _placeRepository.DeletePlaceAsync(place);
        }
    }
}
