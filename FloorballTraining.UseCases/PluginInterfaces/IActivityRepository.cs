using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

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
        Task UpdateIsDraftAsync(int id, bool isDraft);

        Task<ActivityMedia> AddImageAsync(int activityId, ActivityMedia media);
        Task DeleteImageAsync(int activityId, int imageId);
        Task SetThumbnailAsync(int activityId, int imageId);
    }
}