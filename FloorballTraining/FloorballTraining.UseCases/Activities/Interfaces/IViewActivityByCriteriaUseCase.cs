using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities;

public interface IViewActivityByCriteriaUseCase
{
    Task<IEnumerable<Activity>> ExecuteAsync(SearchCriteria criteria);
}