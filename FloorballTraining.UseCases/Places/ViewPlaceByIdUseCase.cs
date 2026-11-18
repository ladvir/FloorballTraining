using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewPlaceByIdUseCase(IPlaceRepository placeRepository, AppMapper mapper) : IViewPlaceByIdUseCase
{
    public async Task<PlaceDto> ExecuteAsync(int placeId)
    {
        var place = await placeRepository.GetByIdAsync(placeId);

        return mapper.ToPlaceDto(place)!; // null stays null (as before), callers check


    }
}