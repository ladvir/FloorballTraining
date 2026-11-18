using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewAgeGroupsUseCase(
    IAgeGroupRepository repository,
    AppMapper mapper) : IViewAgeGroupsUseCase
{
    public async Task<Pagination<AgeGroupDto>> ExecuteAsync(AgeGroupSpecificationParameters parameters)
    {
        var specification = new AgeGroupsSpecification(parameters);

        var countSpecification = new AgeGroupsForCountSpecification(parameters);

        var totalItems = await repository.CountAsync(countSpecification);

        var items = await repository.GetListAsync(specification);

        var data = mapper.ToAgeGroupDtos(items);

        return new Pagination<AgeGroupDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}