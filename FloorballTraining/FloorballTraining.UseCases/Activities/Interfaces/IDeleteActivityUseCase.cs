namespace FloorballTraining.UseCases.Activities;

public interface IDeleteActivityUseCase
{
    Task ExecuteAsync(int activityId);
}