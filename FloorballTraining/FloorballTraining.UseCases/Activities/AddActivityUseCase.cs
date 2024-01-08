using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Activities
{
    public class AddActivityUseCase : IAddActivityUseCase
    {
        private readonly IActivityRepository _inventoryRepository;
        private readonly IActivityFactory _activityFactory;


        public AddActivityUseCase(IActivityRepository inventoryRepository, IActivityFactory activityFactory)
        {
            _inventoryRepository = inventoryRepository;
            _activityFactory = activityFactory;
        }

        public async Task ExecuteAsync(ActivityDto activityDto)
        {
            var activity = await _activityFactory.GetMergedOrBuild(activityDto);

            await _inventoryRepository.AddActivityAsync(activity);
        }
    }
}
