using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Trainings;

public interface ICloneTrainingUseCase
{
    Task<Training> ExecuteAsync(int trainingId);
}