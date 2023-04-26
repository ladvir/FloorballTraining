namespace FloorballTraining.UseCases.Trainings;

public interface ICreateTrainingPdfUseCase
{
    Task<byte[]?> ExecuteAsync(int trainingId);
}