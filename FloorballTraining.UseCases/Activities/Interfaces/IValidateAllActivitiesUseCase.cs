namespace FloorballTraining.UseCases.Activities.Interfaces;

public interface IValidateAllActivitiesUseCase
{
    Task<(int Total, int ValidCount, int DraftCount)> ExecuteAsync();
}
