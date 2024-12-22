using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Activities;

namespace FloorballTraining.UseCases.Trainings;

public interface ICreateTrainingPdfUseCase :ICreatePdfUseCase<TrainingDto>
{
}