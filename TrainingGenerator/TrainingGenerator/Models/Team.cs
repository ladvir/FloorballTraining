using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Services.AcitivityDeletors;
using TrainingGenerator.Services.ActivityCreators;
using TrainingGenerator.Services.ActivityProviders;
using TrainingGenerator.Services.ActivityUpdators;

namespace TrainingGenerator.Models
{
    public class Team
    {
        private readonly IActivityProvider _activityProvider;
        private readonly IActivityCreator _activityCreator;
        private readonly IActivityUpdator _activityUpdator;
        private readonly IActivityDeletor _activityDeletor;

        public Team(IActivityProvider activityProvider,
        IActivityCreator activityCreator,
        IActivityUpdator activityUpdator,
        IActivityDeletor activityDeletor)
        {
            _activityProvider = activityProvider;
            _activityCreator = activityCreator;
            _activityUpdator = activityUpdator;
            _activityDeletor = activityDeletor;
        }

        public int Id { get; set; }

        public string Name { get; set; }

        public async Task<IEnumerable<Activity>> GetActivities()
        {
            return await _activityProvider.GetAllActivities();
        }

        public async Task AddActivity(Activity activity)
        {
            await _activityCreator.CreateActivity(activity);
        }

        public async Task<Activity> GetActivity(int id)
        {
            return await _activityProvider.GetActivity(id);
        }

        public async Task UpdateActivity(Activity activity)
        {
            await _activityUpdator.UpdateActivity(activity);
        }

        internal async Task DeleteActivity(Activity activity)
        {
            await _activityDeletor.DeleteActivity(activity);
        }
    }
}