using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivityNameAndDescriptionByIdUseCase(IActivityRepository repository, IMapper mapper) : IViewActivityNameAndDescriptionByIdUseCase
{
    public async Task<ActivityNameAndDescriptionDto> ExecuteAsync(int tagId)
    {
        var specification = new ActivitiesBaseSpecification(tagId);
 
        var tag = await repository.GetWithSpecification(specification);
 
        return mapper.Map<Activity?, ActivityNameAndDescriptionDto>(tag);
    }
}