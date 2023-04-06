using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities
{
    public class AddActivityUseCase : IAddActivityUseCase
    {
        private readonly IActivityRepository _inventoryRepository;

        public AddActivityUseCase(IActivityRepository inventoryRepository)
        {
            _inventoryRepository = inventoryRepository;
        }

        public async Task ExecuteAsync(Activity activity)
        {
            await _inventoryRepository.AddActivityAsync(activity);
        }
    }
}
