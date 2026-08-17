namespace FloorballTraining.UseCases.Trainings;

public interface IValidateAllTrainingsUseCase
{
    Task<(int Total, int ValidCount, int DraftCount)> ExecuteAsync();
}
