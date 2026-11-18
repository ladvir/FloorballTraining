using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivityBaseByIdUseCase(IActivityRepository repository, AppMapper mapper) : IViewActivityBaseByIdUseCase
{
    public async Task<ActivityBaseDto> ExecuteAsync(int tagId)
    {
        var specification = new ActivitiesBaseSpecification(tagId);

        var tag = await repository.GetWithSpecification(specification);

        return mapper.ToActivityBaseDto(tag)!; // null stays null (as before), callers check
    } }