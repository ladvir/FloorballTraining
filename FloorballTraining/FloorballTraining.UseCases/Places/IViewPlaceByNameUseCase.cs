using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Places;

public interface IViewPlaceByNameUseCase
{
    Task<List<Place>> ExecuteAsync(string searchString = "");
}