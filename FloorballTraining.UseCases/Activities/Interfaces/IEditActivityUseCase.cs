using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities;

public interface IEditActivityUseCase
{
    Task ExecuteAsync(ActivityDto activity);
}