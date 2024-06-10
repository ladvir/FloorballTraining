using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivitiesAllUseCase(
    IActivityRepository repository,
    IMapper mapper) : IViewActivitiesAllUseCase
{
    public async Task<IReadOnlyList<ActivityDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.Map<IReadOnlyList<Activity>, IReadOnlyList<ActivityDto>>(items);
    }
}