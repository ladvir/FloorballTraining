using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Places
{
    public class EditPlaceUseCase : IEditPlaceUseCase
    {
        private readonly IPlaceRepository _placeRepository;
        private readonly IPlaceFactory _placeFactory;


        public EditPlaceUseCase(IPlaceRepository placeRepository, IPlaceFactory placeFactory)
        {
            _placeRepository = placeRepository;
            _placeFactory = placeFactory;
        }

        public async Task ExecuteAsync(PlaceDto placeDto)
        {
            var place = await _placeFactory.GetMergedOrBuild(placeDto);

            await _placeRepository.UpdatePlaceAsync(place);
        }
    }
}
