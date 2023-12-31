using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewPlacesAllUseCase : IViewPlacesAllUseCase
{
    private readonly IPlaceRepository _placeRepository;
    private readonly IMapper _mapper;

    public ViewPlacesAllUseCase(
        IPlaceRepository placeRepository,
        IMapper mapper)
    {
        _placeRepository = placeRepository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<PlaceDto>> ExecuteAsync()
    {
        var places = await _placeRepository.GetAllAsync();

        return _mapper.Map<IReadOnlyList<Place>, IReadOnlyList<PlaceDto>>(places);
    }
}