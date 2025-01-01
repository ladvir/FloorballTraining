using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Trainings;

public interface IViewTrainingsAllUseCase
{
    Task<IReadOnlyList<TrainingDto>> ExecuteAsync();
}