using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities.Interfaces;

public interface IViewActivitiesAllUseCase
{
    Task<IReadOnlyList<ActivityDto>> ExecuteAsync();
}