using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class DeleteActivityUseCase(IActivityRepository activityRepository) : IDeleteActivityUseCase
    {
        public async Task ExecuteAsync(int activityId)
        {
            await activityRepository.DeleteActivityAsync(activityId);
        }
    }
}
