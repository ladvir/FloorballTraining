using AutoMapper;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.AgeGroups;

public class ViewAgeGroupByIdUseCase(IAgeGroupRepository repository, IMapper mapper) : IViewAgeGroupByIdUseCase
{
    public async Task<AgeGroupDto> ExecuteAsync(int id)
    {
        var item = await repository.GetByIdAsync(id);

        return mapper.Map<CoreBusiness.AgeGroup?, AgeGroupDto>(item);
    }
}