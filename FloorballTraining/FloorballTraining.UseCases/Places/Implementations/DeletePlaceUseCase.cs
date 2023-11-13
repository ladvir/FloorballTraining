using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places.Implementations
{
    public class DeletePlaceUseCase : IDeletePlaceUseCase
    {
        private readonly IPlaceRepository _placeRepository;

        public DeletePlaceUseCase(IPlaceRepository placeRepository)
        {
            _placeRepository = placeRepository;
        }

        public async Task ExecuteAsync(Place place)
        {
            await _placeRepository.DeletePlaceAsync(place);
        }
    }
}
