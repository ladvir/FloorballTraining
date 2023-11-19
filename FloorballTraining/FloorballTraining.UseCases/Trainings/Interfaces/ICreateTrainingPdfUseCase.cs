using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Trainings;

public interface ICreateTrainingPdfUseCase
{
    Task<byte[]?> ExecuteAsync(int trainingId, string requestedFrom);

    Task<byte[]?> ExecuteAsync(Training training, string requestedFrom);
}