namespace FloorballTraining.UseCases.Activities;

public interface IViewActivityNextByIdUseCase
{
    Task<int?> ExecuteAsync(int activityId);
}