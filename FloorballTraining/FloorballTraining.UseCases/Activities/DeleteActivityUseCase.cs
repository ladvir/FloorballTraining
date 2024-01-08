using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class DeleteActivityUseCase : IDeleteActivityUseCase
    {
        private readonly IActivityRepository _activityRepository;

        public DeleteActivityUseCase(IActivityRepository activityRepository)
        {
            _activityRepository = activityRepository;
        }

        public async Task ExecuteAsync(int activityId)
        {
            await _activityRepository.DeleteActivityAsync(activityId);
        }
    }
}
