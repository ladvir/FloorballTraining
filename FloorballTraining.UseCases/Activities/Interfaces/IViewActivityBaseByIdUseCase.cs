using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities;

public interface IViewActivityBaseByIdUseCase
{
    Task<ActivityBaseDto> ExecuteAsync(int activityId);
}