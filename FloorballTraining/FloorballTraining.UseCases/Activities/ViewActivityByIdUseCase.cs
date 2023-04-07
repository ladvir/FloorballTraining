using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityByIdUseCase : IViewActivityByIdUseCase
    {
        private readonly IActivityRepository _activityRepository;

        public ViewActivityByIdUseCase(IActivityRepository activityRepository)
        {
            _activityRepository = activityRepository;
        }

        public async Task<Activity> ExecuteAsync(int activityId)
        {
            return await _activityRepository.GetActivityByIdAsync(activityId);
        }
    }
}
