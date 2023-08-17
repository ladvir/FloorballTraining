using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases;

public interface IViewActivityByCriteriaUseCase
{
    Task<IEnumerable<Activity>> ExecuteAsync(ActivitySearchCriteria criteria);
}