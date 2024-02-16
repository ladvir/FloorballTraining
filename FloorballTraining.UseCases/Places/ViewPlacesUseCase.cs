using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewPlacesUseCase : IViewPlacesUseCase
{
    private readonly IPlaceRepository _placeRepository;
    private readonly IMapper _mapper;

    public ViewPlacesUseCase(
        IPlaceRepository placeRepository,
        IMapper mapper)
    {
        _placeRepository = placeRepository;
        _mapper = mapper;
    }

    public async Task<Pagination<PlaceDto>> ExecuteAsync(PlaceSpecificationParameters parameters)
    {
        var specification = new PlacesSpecification(parameters);

        var countSpecification = new PlacesWithFilterForCountSpecification(parameters);

        var totalItems = await _placeRepository.CountAsync(countSpecification);

        var places = await _placeRepository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<Place>, IReadOnlyList<PlaceDto>>(places);

        return new Pagination<PlaceDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}