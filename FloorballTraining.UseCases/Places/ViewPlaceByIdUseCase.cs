using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewPlaceByIdUseCase(IPlaceRepository placeRepository, IMapper mapper) : IViewPlaceByIdUseCase
{
    public async Task<PlaceDto> ExecuteAsync(int placeId)
    {
        var place = await placeRepository.GetByIdAsync(placeId);

        return mapper.Map<Place?, PlaceDto>(place);


    }
}