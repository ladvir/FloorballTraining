using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IAgeGroupRepository
{
    Task<IEnumerable<AgeGroup>> GetAgeGroupsByNameAsync(string searchString = "");
}