using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities;

public interface IViewActivityByCriteriaUseCase
{
    Task<IEnumerable<Activity>> ExecuteAsync(SearchCriteria criteria);
}