using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Trainings;

public interface IAddTrainingUseCase
{
    Task ExecuteAsync(Training training);
}