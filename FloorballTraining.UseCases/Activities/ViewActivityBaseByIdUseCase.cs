using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivityBaseByIdUseCase(IActivityRepository repository, IMapper mapper) : IViewActivityBaseByIdUseCase
{
    public async Task<ActivityBaseDto> ExecuteAsync(int tagId)
    {
        var specification = new ActivitiesBaseSpecification(tagId);

        var tag = await repository.GetWithSpecification(specification);

        return mapper.Map<Activity?, ActivityBaseDto>(tag);
    } }