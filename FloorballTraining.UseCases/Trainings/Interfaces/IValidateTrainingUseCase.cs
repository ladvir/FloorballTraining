using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Trainings;

public interface IValidateTrainingUseCase
{
    Task<TrainingDto> ExecuteAsync(int id, int? minPartsDurationPercent = null);
}
