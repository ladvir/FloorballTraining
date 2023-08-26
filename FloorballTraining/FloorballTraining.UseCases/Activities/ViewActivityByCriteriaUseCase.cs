using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivityByCriteriaUseCase : IViewActivityByCriteriaUseCase
{
    private readonly IActivityRepository _activityRepository;

    public ViewActivityByCriteriaUseCase(IActivityRepository activityRepository)
    {
        _activityRepository = activityRepository;
    }

    public async Task<IEnumerable<Activity>> ExecuteAsync(SearchCriteria criteria)
    {
        return await _activityRepository.GetActivitiesByCriteriaAsync(criteria);
    }
}