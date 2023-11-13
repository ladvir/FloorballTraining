using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Trainings;

public interface IViewTrainingByIdUseCase
{
    Task<Training?> ExecuteAsync(int trainingId);
}