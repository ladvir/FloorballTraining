using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class CloneActivityUseCase : ICloneActivityUseCase
    {
        private readonly IActivityRepository _activityRepository;

        public CloneActivityUseCase(IActivityRepository activityRepository)
        {
            _activityRepository = activityRepository;
        }

        public async Task<ActivityDto?> ExecuteAsync(int activityId)
        {
            var activity = await _activityRepository.CloneActivityAsync(activityId);

            return activity.ToDto();
        }
    }
}
