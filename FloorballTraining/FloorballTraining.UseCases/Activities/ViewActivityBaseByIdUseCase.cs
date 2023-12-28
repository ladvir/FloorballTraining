using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivityBaseByIdUseCase : IViewActivityBaseByIdUseCase
{
    private readonly IActivityRepository _repository;
    private readonly IMapper _mapper;

    public ViewActivityBaseByIdUseCase(IActivityRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<ActivityBaseDto> ExecuteAsync(int tagId)
    {
        var specification = new ActivitiesBaseSpecification(tagId);

        var tag = await _repository.GetWithSpecification(specification);

        return _mapper.Map<Activity?, ActivityBaseDto>(tag);
    }
}