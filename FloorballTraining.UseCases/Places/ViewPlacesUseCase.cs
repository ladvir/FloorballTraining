using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewPlacesUseCase(
    IPlaceRepository placeRepository,
    AppMapper mapper) : IViewPlacesUseCase
{
    public async Task<Pagination<PlaceDto>> ExecuteAsync(PlaceSpecificationParameters parameters)
    {
        var specification = new PlacesSpecification(parameters);

        var countSpecification = new PlacesWithFilterForCountSpecification(parameters);

        var totalItems = await placeRepository.CountAsync(countSpecification);

        var places = await placeRepository.GetListAsync(specification);

        var data = mapper.ToPlaceDtos(places);

        return new Pagination<PlaceDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}