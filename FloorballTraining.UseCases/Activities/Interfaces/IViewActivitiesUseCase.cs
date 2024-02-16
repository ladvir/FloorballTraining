using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Activities.Interfaces;

public interface IViewActivitiesUseCase
{
    Task<Pagination<ActivityDto>> ExecuteAsync(ActivitySpecificationParameters parameters);
}