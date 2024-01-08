using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class GetActivityByIdUseCase : IGetActivityByIdUseCase
{
    private readonly IActivityRepository _repository;

    public GetActivityByIdUseCase(IActivityRepository repository)
    {
        _repository = repository;
    }

    public async Task<Activity?> ExecuteAsync(int id)
    {
        return await _repository.GetWithSpecification(new ActivitiesSpecification(id));
    }
}