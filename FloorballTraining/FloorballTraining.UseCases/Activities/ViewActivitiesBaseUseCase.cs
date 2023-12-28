using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivitiesBaseUseCase : IViewActivitiesBaseUseCase
{
    private readonly IActivityRepository _repository;
    private readonly IMapper _mapper;

    public ViewActivitiesBaseUseCase(
        IActivityRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<Pagination<ActivityBaseDto>> ExecuteAsync(ActivitySpecificationParameters parameters)
    {
        var specification = new ActivitiesSpecification(parameters);

        var countSpecification = new ActivitiesForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var items = await _repository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<Activity>, IReadOnlyList<ActivityBaseDto>>(items);

        return new Pagination<ActivityBaseDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }

    public async Task<Pagination<ActivityBaseDto>> ExecuteAsync(ActivityBaseSpecificationParameters parameters)
    {
        var specification = new ActivitiesBaseSpecification(parameters);

        var countSpecification = new ActivitiesBaseForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var items = await _repository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<Activity>, IReadOnlyList<ActivityBaseDto>>(items);

        return new Pagination<ActivityBaseDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}