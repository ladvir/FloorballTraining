using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places.Implementations;

public class ViewPlaceByNameUseCase : IViewPlaceByNameUseCase
{
    private readonly IPlaceRepository _placeRepository;

    public ViewPlaceByNameUseCase(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }


    public async Task<List<Place>> ExecuteAsync(string searchString = "")
    {
        return await _placeRepository.GetPlacesByNameAsync(searchString);
    }
}