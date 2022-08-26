using System.Collections.Generic;
using System.Threading.Tasks;
using TrainingGenerator.Services;
using TrainingGenerator.Services.AcitivityDeletors;

namespace TrainingGenerator.Models
{
    public class Team
    {
        private readonly IActivityService _activityService;

        private ITrainingService _trainingService;

        public Team(
            IActivityService activityService,
            ITrainingService trainingService
            )
        {
            _activityService = activityService;
            _trainingService = trainingService;
        }

        public int TeamId { get; set; }

        public string Name { get; set; }

        public async Task<IEnumerable<Activity>> GetActivities()
        {
            return await _activityService.GetAllActivities();
        }

        public async Task<Activity> AddActivity(Activity activity)
        {
            return await _activityService.CreateActivity(activity);
        }

        public async Task<Activity> GetActivity(int id)
        {
            return await _activityService.GetActivity(id);
        }

        public async Task UpdateActivity(Activity activity)
        {
            await _activityService.UpdateActivity(activity);
        }

        public async Task DeleteActivity(Activity activity)
        {
            await _activityService.DeleteActivity(activity);
        }

        public async Task<IEnumerable<Training>> GetTrainings()
        {
            return await _trainingService.GetAllTrainings();
        }

        public async Task<Training> AddTraining(Training training)
        {
            return await _trainingService.CreateTraining(training);
        }
    }
}