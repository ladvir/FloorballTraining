using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityNextByIdUseCase(IActivityRepository activityRepository) : IViewActivityNextByIdUseCase
    {
        public async Task<int?> ExecuteAsync(int activityId)
        {
            return await activityRepository.GetActivityNextByIdAsync(activityId);
        }
    }
}
