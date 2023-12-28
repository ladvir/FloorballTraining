using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivitiesUseCase : IViewActivitiesUseCase
{
    private readonly IActivityRepository _repository;
    private readonly IMapper _mapper;

    public ViewActivitiesUseCase(
        IActivityRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<Pagination<ActivityDto>> ExecuteAsync(ActivitySpecificationParameters parameters)
    {
        var specification = new ActivitiesSpecification(parameters);

        var countSpecification = new ActivitiesForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var items = await _repository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<Activity>, IReadOnlyList<ActivityDto>>(items);

        return new Pagination<ActivityDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}