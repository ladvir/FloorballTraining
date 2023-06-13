namespace FloorballTraining.UseCases.Activities;

public interface ICreateActivityPdfUseCase
{
    Task<byte[]?> ExecuteAsync(int activityId);
}