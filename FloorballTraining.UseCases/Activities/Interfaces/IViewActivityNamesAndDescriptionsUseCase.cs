using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Activities.Interfaces;

public interface IViewActivityNamesAndDescriptionsUseCase
{
    Task<Pagination<ActivityNameAndDescriptionDto>> ExecuteAsync(ActivitySpecificationParameters parameters);
}