using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityPrevByIdUseCase : IViewActivityPrevByIdUseCase
    {
        private readonly IActivityRepository _activityRepository;

        public ViewActivityPrevByIdUseCase(IActivityRepository activityRepository)
        {
            _activityRepository = activityRepository;
        }

        public async Task<int?> ExecuteAsync(int activityId)
        {
            return await _activityRepository.GetActivityPrevByIdAsync(activityId);
        }
    }
}
