using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivitiesAllUseCase : IViewActivitiesAllUseCase
{
    private readonly IActivityRepository _repository;
    private readonly IMapper _mapper;

    public ViewActivitiesAllUseCase(
        IActivityRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<ActivityDto>> ExecuteAsync()
    {
        var items = await _repository.GetAllAsync();

        return _mapper.Map<IReadOnlyList<Activity>, IReadOnlyList<ActivityDto>>(items);
    }
}