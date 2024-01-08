using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities;

public interface ICreateActivityPdfUseCase
{
    Task<byte[]?> ExecuteAsync(int activityId, string requestedFrom);

    Task<byte[]?> ExecuteAsync(ActivityDto? activity, string requestedFrom);
}