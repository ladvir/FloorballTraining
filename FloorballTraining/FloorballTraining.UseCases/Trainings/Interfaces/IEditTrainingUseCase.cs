using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Trainings;

public interface IEditTrainingUseCase
{
    Task ExecuteAsync(Training training);
}