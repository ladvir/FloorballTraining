using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Activities
{
    public class EditActivityUseCase : IEditActivityUseCase
    {
        private readonly IActivityRepository _activityRepository;
        private readonly IActivityFactory _activityFactory;

        public EditActivityUseCase(IActivityRepository activityRepository, IActivityFactory activityFactory)
        {
            _activityRepository = activityRepository;
            _activityFactory = activityFactory;
        }

        public async Task ExecuteAsync(ActivityDto activityDto)
        {
            var activity = await _activityFactory.GetMergedOrBuild(activityDto);

            await _activityRepository.UpdateActivityAsync(activity);
        }
    }
}
