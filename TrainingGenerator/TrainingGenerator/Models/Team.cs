using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Services.AcitivityDeletors;

namespace TrainingGenerator.Models
{
    public class Team
    {
        private readonly IActivityService _activityService;

        public Team(IActivityService activityService)
        {
            _activityService = activityService;
        }

        public int Id { get; set; }

        public string Name { get; set; }

        public async Task<IEnumerable<Activity>> GetActivities()
        {
            return await _activityService.GetAllActivities();
        }

        public async Task AddActivity(Activity activity)
        {
            await _activityService.CreateActivity(activity);
        }

        public async Task<Activity> GetActivity(int id)
        {
            return await _activityService.GetActivity(id);
        }

        public async Task UpdateActivity(Activity activity)
        {
            await _activityService.UpdateActivity(activity);
        }

        internal async Task DeleteActivity(Activity activity)
        {
            await _activityService.DeleteActivity(activity);
        }
    }
}