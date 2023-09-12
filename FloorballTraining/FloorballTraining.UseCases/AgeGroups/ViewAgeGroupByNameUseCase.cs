using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.AgeGroups;

public class ViewAgeGroupByNameUseCase : IViewAgeGroupByNameUseCase
{
    private readonly IAgeGroupRepository _ageGroupRepository;


    public ViewAgeGroupByNameUseCase(IAgeGroupRepository ageGroupRepository)
    {
        _ageGroupRepository = ageGroupRepository;
    }

    public async Task<IEnumerable<AgeGroup>> ExecuteAsync(string searchString = "")
    {
        return await _ageGroupRepository.GetAgeGroupsByNameAsync(searchString);
    }
}