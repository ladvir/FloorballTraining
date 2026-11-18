using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.AgeGroups;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewAgeGroupsAllUseCase(
    IAgeGroupRepository repository,
    AppMapper mapper) : IViewAgeGroupsAllUseCase
{
    public async Task<IReadOnlyList<AgeGroupDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.ToAgeGroupDtos(items);


    }
}