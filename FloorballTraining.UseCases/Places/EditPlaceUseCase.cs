using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Places
{
    public class EditPlaceUseCase(IPlaceRepository placeRepository, IPlaceFactory placeFactory)
        : IEditPlaceUseCase
    {
        public async Task ExecuteAsync(PlaceDto placeDto)
        {
            var place = await placeFactory.GetMergedOrBuild(placeDto);

            await placeRepository.UpdatePlaceAsync(place);
        }
    }
}
