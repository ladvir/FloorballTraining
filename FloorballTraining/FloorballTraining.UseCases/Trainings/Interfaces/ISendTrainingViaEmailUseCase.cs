namespace FloorballTraining.UseCases.Trainings;

public interface ISendTrainingViaEmailUseCase
{
    Task ExecuteAsync(List<int> trainingIds, string[] to);
}