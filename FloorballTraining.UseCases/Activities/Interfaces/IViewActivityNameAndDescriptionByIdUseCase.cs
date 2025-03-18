using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities;

public interface IViewActivityNameAndDescriptionByIdUseCase
{
    Task<ActivityNameAndDescriptionDto> ExecuteAsync(int activityId);
}