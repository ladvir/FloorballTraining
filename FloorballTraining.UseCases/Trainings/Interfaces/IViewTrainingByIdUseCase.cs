using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Trainings;

public interface IViewTrainingByIdUseCase
{
    Task<TrainingDto?> ExecuteAsync(int trainingId);
}