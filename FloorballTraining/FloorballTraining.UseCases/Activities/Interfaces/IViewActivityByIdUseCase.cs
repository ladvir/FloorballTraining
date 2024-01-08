using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities;

public interface IViewActivityByIdUseCase
{
    Task<ActivityDto?> ExecuteAsync(int activityId);
}