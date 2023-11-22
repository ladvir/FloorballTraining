using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;


namespace FloorballTraining.UseCases.Trainings;

public class ViewTrainingByCriteriaUseCase : IViewTrainingByCriteriaUseCase
{
    private readonly ITrainingRepository _trainingRepository;

    public ViewTrainingByCriteriaUseCase(ITrainingRepository trainingRepository)
    {
        _trainingRepository = trainingRepository;
    }

    public async Task<IEnumerable<Training>> ExecuteAsync(SearchCriteria? criteria)
    {
        return await _trainingRepository.GetTrainingsByCriteriaAsync(criteria);
    }
}