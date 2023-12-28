using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Activities.Interfaces;

public interface IViewActivitiesBaseUseCase
{
    Task<Pagination<ActivityBaseDto>> ExecuteAsync(ActivitySpecificationParameters parameters);

    Task<Pagination<ActivityBaseDto>> ExecuteAsync(ActivityBaseSpecificationParameters parameters);
}