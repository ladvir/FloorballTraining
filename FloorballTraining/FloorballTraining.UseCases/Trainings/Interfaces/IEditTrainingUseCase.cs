using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Trainings;

public interface IEditTrainingUseCase
{
    Task ExecuteAsync(TrainingDto training);
}