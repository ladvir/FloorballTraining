namespace FloorballTraining.UseCases.Activities;

public interface ISendActivityViaEmailUseCase
{
    Task ExecuteAsync(List<int> activityIds, string[] to);

}