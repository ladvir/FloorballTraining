using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewPlacesAllUseCase(
    IPlaceRepository placeRepository,
    AppMapper mapper) : IViewPlacesAllUseCase
{
    public async Task<IReadOnlyList<PlaceDto>> ExecuteAsync()
    {
        var places = await placeRepository.GetAllAsync();

        return mapper.ToPlaceDtos(places);
    }
}