using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities;

public interface IAddActivityUseCase
{
    Task ExecuteAsync(ActivityDto activity);
}