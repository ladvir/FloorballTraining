using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
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
        var specification = new PlacesSpecification(placeId);

        var place = await _placeRepository.GetWithSpecification(specification);

        return _mapper.Map<Place?, PlaceDto>(place);


    }
}