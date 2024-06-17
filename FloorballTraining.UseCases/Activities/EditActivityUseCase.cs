using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Activities
{
    public class EditActivityUseCase(IActivityRepository activityRepository, IActivityFactory activityFactory)
        : IEditActivityUseCase
    {
        public async Task ExecuteAsync(ActivityDto activityDto)
        {
            var activity = await activityFactory.GetMergedOrBuild(activityDto);

            await activityRepository.UpdateActivityAsync(activity);
        }
    }
}
