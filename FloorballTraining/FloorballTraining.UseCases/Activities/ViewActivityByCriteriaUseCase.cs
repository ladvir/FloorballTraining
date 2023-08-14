using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.WebApp.Data;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivityByCriteriaUseCase : IViewActivityByCriteriaUseCase
{
    private readonly IActivityRepository _activityRepository;

    public ViewActivityByCriteriaUseCase(IActivityRepository activityRepository)
    {
        _activityRepository = activityRepository;
    }

    public async Task<IEnumerable<CoreBusiness.Activity>> ExecuteAsync(ActivitySearchCriteria criteria)
    {
        return await _activityRepository.GetActivitiesByCriteriaAsync(criteria);
    }
}