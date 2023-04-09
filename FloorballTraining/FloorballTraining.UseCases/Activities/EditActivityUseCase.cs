using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class EditActivityUseCase : IEditActivityUseCase
    {
        private readonly IActivityRepository _activityRepository;

        public EditActivityUseCase(IActivityRepository activityRepository)
        {
            _activityRepository = activityRepository;
        }

        public async Task ExecuteAsync(Activity activity)
        {
            //todo zavolat validator tady?
            await _activityRepository.UpdateActivityAsync(activity);
        }
    }
}
