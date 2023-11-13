using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places.Implementations
{
    public class EditPlaceUseCase : IEditPlaceUseCase
    {
        private readonly IPlaceRepository _placeRepository;

        public EditPlaceUseCase(IPlaceRepository placeRepository)
        {
            _placeRepository = placeRepository;
        }

        public async Task ExecuteAsync(Place place)
        {
            await _placeRepository.UpdatePlaceAsync(place);
        }
    }
}
