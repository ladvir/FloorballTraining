using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivitiesUseCase(
    IActivityRepository repository,
    IMapper mapper) : IViewActivitiesUseCase
{
    public async Task<Pagination<ActivityDto>> ExecuteAsync(ActivitySpecificationParameters parameters)
    {
        var specification = new ActivitiesSpecification(parameters);

        var countSpecification = new ActivitiesForCountSpecification(parameters);

        var totalItems = await repository.CountAsync(countSpecification);

        var items = await repository.GetListAsync(specification);

        //var data = items.Select(item => item.ToDto()!).ToList();

        var data = mapper.Map<IReadOnlyList<Activity>, IReadOnlyList<ActivityDto>>(items);

        return new Pagination<ActivityDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}