using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places.Implementations;

public class ViewPlaceByIdUseCase : IViewPlaceByIdUseCase
{
    private readonly IPlaceRepository _placeRepository;

    public ViewPlaceByIdUseCase(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Place> ExecuteAsync(int placeId)
    {
        return await _placeRepository.GetPlaceByIdAsync(placeId);
    }
}