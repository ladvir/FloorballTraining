using TrainingDataAccess.Models;

namespace TrainingGenerator.Services.AcitivityDeletors
{
    public interface IActivityService
    {
        Task DeleteActivity(Activity activity);

        Task<Activity> CreateActivity(Activity activity);

        Task<IEnumerable<Activity>> GetAllActivities();

        Task<Activity> GetActivity(int id);

        Task UpdateActivity(Activity activity);
    }
}