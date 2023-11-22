using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Trainings;

public interface IViewTrainingByCriteriaUseCase
{
    Task<IEnumerable<Training>> ExecuteAsync(SearchCriteria? criteria);
}
