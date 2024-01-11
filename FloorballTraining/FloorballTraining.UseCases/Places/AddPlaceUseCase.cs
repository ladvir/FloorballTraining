using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Places.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Places
{
    public class AddPlaceUseCase : IAddPlaceUseCase
    {
        private readonly IPlaceRepository _placeRepository;
        private readonly IPlaceFactory _placeFactory;

        public AddPlaceUseCase(IPlaceRepository placeRepository, IPlaceFactory placeFactory)
        {
            _placeRepository = placeRepository;
            _placeFactory = placeFactory;
        }

        public async Task ExecuteAsync(PlaceDto placeDto)
        {
            var place = await _placeFactory.GetMergedOrBuild(placeDto);
            await _placeRepository.AddPlaceAsync(place);
        }


    }
}
