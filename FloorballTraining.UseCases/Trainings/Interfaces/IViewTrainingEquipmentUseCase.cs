namespace FloorballTraining.UseCases.Trainings;

public interface IViewTrainingEquipmentUseCase
{
    Task<List<string?>> ExecuteAsync(int trainingId);
}