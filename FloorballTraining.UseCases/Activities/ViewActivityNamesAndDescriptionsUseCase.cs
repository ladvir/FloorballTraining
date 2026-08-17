using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivityNamesAndDescriptionsUseCase(
    IActivityRepository repository,
    IMapper mapper) : IViewActivityNamesAndDescriptionsUseCase
{
    public async Task<Pagination<ActivityNameAndDescriptionDto>> ExecuteAsync(ActivitySpecificationParameters parameters)
    {
        var specification = new ActivitiesSpecification(parameters);
 
        var countSpecification = new ActivitiesForCountSpecification(parameters);
 
        var totalItems = await repository.CountAsync(countSpecification);
 
        var items = await repository.GetListAsync(specification);
 
        var data = mapper.Map<IReadOnlyList<Activity>, IReadOnlyList<ActivityNameAndDescriptionDto>>(items);
 
        return new Pagination<ActivityNameAndDescriptionDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}