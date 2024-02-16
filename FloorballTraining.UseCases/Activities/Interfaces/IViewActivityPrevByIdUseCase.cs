namespace FloorballTraining.UseCases.Activities;

public interface IViewActivityPrevByIdUseCase
{
    Task<int?> ExecuteAsync(int activityId);
}