using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface IActivityRepository
    {
        Task<IEnumerable<Activity>> GetActivitiesByNameAsync(string searchString = "");
        Task AddActivityAsync(Activity activity);
        Task EditActivityAsync(Activity existingActivity);
        Task<Activity> GetActivityByIdAsync(int activityId);
    }
}
