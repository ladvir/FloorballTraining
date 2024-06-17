using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Places.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Places
{
    public class AddPlaceUseCase(IPlaceRepository placeRepository, IPlaceFactory placeFactory)
        : IAddPlaceUseCase
    {
        public async Task ExecuteAsync(PlaceDto placeDto)
        {
            var place = await placeFactory.GetMergedOrBuild(placeDto);
            await placeRepository.AddPlaceAsync(place);
        }


    }
}
