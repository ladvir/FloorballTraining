using TrainingDataAccess.Dtos;

namespace TrainingDataAccess.Services.ActivityServices
{
    public interface IActivityService
    {
        Task DeleteActivity(ActivityDto activity);

        Task<ActivityDto> GetActivity(int id);

        Task<DataResult<ActivityDto>> GetActivities(PaginationDTO pagination, string searchString);

        Task SaveActivity(ActivityDto activity);
    }
}