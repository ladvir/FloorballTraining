using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class CloneActivityUseCase(IActivityRepository activityRepository) : ICloneActivityUseCase
    {
        public async Task<ActivityDto?> ExecuteAsync(int activityId)
        {
            var activity = await activityRepository.CloneActivityAsync(activityId);

            return activity.ToDto();
        }
    }
}
