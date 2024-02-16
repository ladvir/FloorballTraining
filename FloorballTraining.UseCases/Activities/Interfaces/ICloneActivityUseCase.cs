using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities;

public interface ICloneActivityUseCase
{
    Task<ActivityDto?> ExecuteAsync(int activityId);
}