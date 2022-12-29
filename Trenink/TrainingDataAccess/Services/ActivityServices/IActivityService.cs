using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.ActivityServices
{
    public interface IActivityService
    {
        Task DeleteActivity(Activity activity);

        Task<Activity> CreateActivity(Activity activity);

        Task<List<Activity>> GetAllActivities();

        Task<Activity> GetActivity(int id);

        Task UpdateActivity(Activity activity);
    }
}