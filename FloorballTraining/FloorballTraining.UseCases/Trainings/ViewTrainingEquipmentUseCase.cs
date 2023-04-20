using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class ViewTrainingEquipmentUseCase : IViewTrainingEquipmentUseCase
    {
        private readonly ITrainingRepository _trainingRepository;
        public ViewTrainingEquipmentUseCase(ITrainingRepository trainingRepository)
        {
            _trainingRepository = trainingRepository;
        }

        public async Task<List<string?>> ExecuteAsync(int trainingId)
        {
            return await _trainingRepository.GetEquipmentByTrainingIdAsync(trainingId);
        }

    }
}
