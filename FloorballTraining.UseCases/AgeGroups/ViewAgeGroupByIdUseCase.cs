using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.AgeGroups;

public class ViewAgeGroupByIdUseCase(IAgeGroupRepository repository, AppMapper mapper) : IViewAgeGroupByIdUseCase
{
    public async Task<AgeGroupDto> ExecuteAsync(int id)
    {
        var item = await repository.GetByIdAsync(id);

        return mapper.ToAgeGroupDto(item)!; // null stays null (as before), callers check
    }
}