using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ViewActivityByCriteriaUseCase(IActivityRepository activityRepository) : IViewActivityByCriteriaUseCase
{
    public async Task<IEnumerable<Activity>> ExecuteAsync(SearchCriteria criteria)
    {
        return await activityRepository.GetActivitiesByCriteriaAsync(criteria);

        //return await Task.FromResult(_activityRepository.GetActivitiesByCriteria(criteria));
    }
}