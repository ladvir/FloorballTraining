using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface IActivityRepository : IGenericRepository<Activity>
    {
        Task AddActivityAsync(Activity activity);
        Task UpdateActivityAsync(Activity existingActivity);
        Task<Activity> GetActivityByIdAsync(int activityId);
        Task<Activity> CloneActivityAsync(int activityId);
        Task DeleteActivityAsync(int activityId);
        Task<int?> GetActivityNextByIdAsync(int activityId);
        Task<int?> GetActivityPrevByIdAsync(int activityId);

        Task<IReadOnlyList<Activity>> GetActivitiesByCriteriaAsync(SearchCriteria criteria);
    }
}