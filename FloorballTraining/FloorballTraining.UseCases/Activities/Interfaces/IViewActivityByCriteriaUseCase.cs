using FloorballTraining.WebApp.Data;

namespace FloorballTraining.UseCases;

public interface IViewActivityByCriteriaUseCase
{
    Task<IEnumerable<CoreBusiness.Activity>> ExecuteAsync(ActivitySearchCriteria criteria);
}