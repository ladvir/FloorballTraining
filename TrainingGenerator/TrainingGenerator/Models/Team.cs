using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Services.ActivityCreators;
using TrainingGenerator.Services.ActivityProviders;

namespace TrainingGenerator.Models
{
    public class Team
    {
        private readonly IActivityProvider _activityProvider;
        private readonly IActivityCreator _activityCreator;

        public Team(IActivityProvider activityProvider, IActivityCreator activityCreator)
        {
            _activityProvider = activityProvider;
            _activityCreator = activityCreator;
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
    }
}