namespace FloorballTraining.UseCases.Trainings;

public interface IDeleteTrainingUseCase
{
    Task ExecuteAsync(int id);
}