using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Services.ActivityServices
{
    public interface IActivityService
    {
        Task DeleteActivity(int activityId);

        Task<ActivityDto> GetActivity(int id);

        Task<DataResult<ActivityOverviewDto>> GetActivities(PaginationDTO pagination, string searchString);

        Task<List<ActivityOverviewDto>> GetActivitiesAll(string searchString);

        Task SaveActivity(ActivityDto activity);
    }
}