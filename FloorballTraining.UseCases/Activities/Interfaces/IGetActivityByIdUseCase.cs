using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities;

public interface IGetActivityByIdUseCase
{
    Task<Activity?> ExecuteAsync(int activityId);
}