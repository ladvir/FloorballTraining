using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases;

public interface IViewActivityByCriteriaUseCase
{
    Task<IEnumerable<Activity>> ExecuteAsync(SearchCriteria criteria);
}