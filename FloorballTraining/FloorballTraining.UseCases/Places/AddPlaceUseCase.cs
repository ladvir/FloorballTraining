using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places
{
    public class AddPlaceUseCase : IAddPlaceUseCase
    {
        private readonly IPlaceRepository _placeRepository;

        public AddPlaceUseCase(IPlaceRepository placeRepository)
        {
            _placeRepository = placeRepository;
        }

        public async Task ExecuteAsync(Place? place)
        {
            if (place == null) return;
            await _placeRepository.AddPlaceAsync(place);
        }
    }
}
