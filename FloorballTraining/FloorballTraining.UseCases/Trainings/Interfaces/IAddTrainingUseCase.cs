using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Trainings;

public interface IAddTrainingUseCase
{
    Task ExecuteAsync(TrainingDto training);
}