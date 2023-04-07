using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities;

public interface IViewActivityByIdUseCase
{
    Task<Activity> ExecuteAsync(int activityId);
}