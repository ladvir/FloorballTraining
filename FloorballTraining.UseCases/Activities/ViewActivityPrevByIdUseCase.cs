using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityPrevByIdUseCase(IActivityRepository activityRepository) : IViewActivityPrevByIdUseCase
    {
        public async Task<int?> ExecuteAsync(int activityId)
        {
            return await activityRepository.GetActivityPrevByIdAsync(activityId);
        }
    }
}
