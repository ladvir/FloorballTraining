using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IPlaceRepository : IGenericRepository<Place>
{
    Task UpdatePlaceAsync(Place place);
    Task AddPlaceAsync(Place place);
    Task DeletePlaceAsync(PlaceDto place);
}