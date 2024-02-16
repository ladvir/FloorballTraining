using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityNextByIdUseCase : IViewActivityNextByIdUseCase
    {
        private readonly IActivityRepository _activityRepository;

        public ViewActivityNextByIdUseCase(IActivityRepository activityRepository)
        {
            _activityRepository = activityRepository;
        }

        public async Task<int?> ExecuteAsync(int activityId)
        {
            return await _activityRepository.GetActivityNextByIdAsync(activityId);
        }
    }
}
