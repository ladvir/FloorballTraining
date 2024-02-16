using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewPlaceByIdUseCase : IViewPlaceByIdUseCase
{
    private readonly IPlaceRepository _placeRepository;
    private readonly IMapper _mapper;

    public ViewPlaceByIdUseCase(IPlaceRepository placeRepository, IMapper mapper)
    {
        _placeRepository = placeRepository;
        _mapper = mapper;
    }

    public async Task<PlaceDto> ExecuteAsync(int placeId)
    {
        var place = await _placeRepository.GetByIdAsync(placeId);

        return _mapper.Map<Place?, PlaceDto>(place);


    }
}