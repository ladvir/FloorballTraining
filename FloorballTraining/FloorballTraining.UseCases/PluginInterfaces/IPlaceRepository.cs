using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IPlaceRepository
{
    Task<List<Place>> GetPlacesByNameAsync(string searchString);
    Task<Place> GetPlaceByNameAsync(string searchString);
    Task<bool> ExistsPlaceByNameAsync(string searchString);
    Task UpdatePlaceAsync(Place place);
    Task<Place> GetPlaceByIdAsync(int placeId);
    Task AddPlaceAsync(Place place);
    Task DeletePlaceAsync(Place place);
}