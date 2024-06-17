using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewPlacesAllUseCase(
    IPlaceRepository placeRepository,
    IMapper mapper) : IViewPlacesAllUseCase
{
    public async Task<IReadOnlyList<PlaceDto>> ExecuteAsync()
    {
        var places = await placeRepository.GetAllAsync();

        return mapper.Map<IReadOnlyList<Place>, IReadOnlyList<PlaceDto>>(places);
    }
}