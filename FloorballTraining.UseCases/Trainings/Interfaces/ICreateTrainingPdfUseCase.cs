using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Trainings;

public interface ICreateTrainingPdfUseCase
{


    Task<byte[]?> ExecuteAsync(TrainingDto training, string requestedFrom);
}