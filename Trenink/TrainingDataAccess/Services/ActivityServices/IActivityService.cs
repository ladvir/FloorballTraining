using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.ActivityServices
{
    public interface IActivityService
    {
        Task DeleteActivity(Activity activity);

        Task DeleteActivity(ActivityDto activity);

        Task<Activity> CreateActivity(Activity activity);

        //Task<List<Activity>> GetAllActivities();
        Task<List<ActivityDto>> GetAllActivities2();

        Task<Activity> GetActivity(int id);

        Task UpdateActivity(Activity activity);
    }
}