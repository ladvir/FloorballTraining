using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class CloneActivityUseCase : ICloneActivityUseCase
    {
        private readonly IActivityRepository _activityRepository;

        public CloneActivityUseCase(IActivityRepository activityRepository)
        {
            _activityRepository = activityRepository;
        }

        public async Task<Activity> ExecuteAsync(Activity activity)
        {
            return await _activityRepository.CloneActivityAsync(activity);
        }
    }
}
