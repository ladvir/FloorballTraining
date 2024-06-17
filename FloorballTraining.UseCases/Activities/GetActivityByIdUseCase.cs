using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class GetActivityByIdUseCase(IActivityRepository repository) : IGetActivityByIdUseCase
{
    public async Task<Activity?> ExecuteAsync(int id)
    {
        return await repository.GetWithSpecification(new ActivitiesSpecification(id));
    }
}