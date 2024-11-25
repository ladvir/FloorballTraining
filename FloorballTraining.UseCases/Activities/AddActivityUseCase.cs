using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Activities
{
    public class AddActivityUseCase(IActivityRepository inventoryRepository, IActivityFactory activityFactory)
        : IAddActivityUseCase
    {
        public async Task ExecuteAsync(ActivityDto activityDto)
        {
            var activity = await activityFactory.GetMergedOrBuild(activityDto);

            await inventoryRepository.AddActivityAsync(activity);

            activityDto.Id = activity.Id;
        }
    }
}
