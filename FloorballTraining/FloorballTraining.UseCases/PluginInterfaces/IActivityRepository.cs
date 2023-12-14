using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface IActivityRepository
    {
        Task<IReadOnlyList<Activity>> GetActivitiesByNameAsync(string searchString = "");
        Task AddActivityAsync(Activity activity);
        Task UpdateActivityAsync(Activity existingActivity);
        Task<Activity> GetActivityByIdAsync(int activityId);
        Task<Activity> CloneActivityAsync(Activity activity);
        Task DeleteActivityAsync(Activity activity);
        Task<int?> GetActivityNextByIdAsync(int activityId);
        Task<int?> GetActivityPrevByIdAsync(int activityId);

        Task<IReadOnlyList<Activity>> GetActivitiesByCriteriaAsync(SearchCriteria criteria);
    }
}
