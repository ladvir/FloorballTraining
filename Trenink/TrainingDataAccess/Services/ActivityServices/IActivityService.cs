using TrainingDataAccess.Dtos;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.ActivityServices
{
    public interface IActivityService
    {
        Task DeleteActivity(Activity activity);

        Task DeleteActivity(ActivityDto activity);

        Task<Activity> CreateActivity(Activity activity);

        Task<List<ActivityDto>> GetAllActivities();

        Task<ActivityDto> GetActivity(int id);

        Task UpdateActivity(Activity activity);

        Task<DataResult<ActivityDto>> GetActivities(PaginationDTO pagination, string searchString);


        Task SaveActivity(ActivityDto activity);
    }
}