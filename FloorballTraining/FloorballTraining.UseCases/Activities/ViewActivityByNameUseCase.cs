using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class ViewActivityByNameUseCase : IViewActivityByNameUseCase
    {
        private readonly IActivityRepository _activityRepository;

        public ViewActivityByNameUseCase(IActivityRepository activityRepository)
        {
            _activityRepository = activityRepository;
        }

        public async Task<IEnumerable<CoreBusiness.Activity>> ExecuteAsync(string searchString = "")
        {
            return await _activityRepository.GetActivitiesByNameAsync(searchString);
        }
    }
}
