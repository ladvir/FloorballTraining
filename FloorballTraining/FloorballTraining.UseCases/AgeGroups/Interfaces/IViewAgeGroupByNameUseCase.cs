using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.AgeGroups;

public interface IViewAgeGroupByNameUseCase
{
    Task<IEnumerable<AgeGroup>> ExecuteAsync(string searchString = "");
}