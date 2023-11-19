using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities;

public interface ICreateActivityPdfUseCase
{
    Task<byte[]?> ExecuteAsync(int activityId, string requestedFrom);

    Task<byte[]?> ExecuteAsync(Activity activity, string requestedFrom);
}