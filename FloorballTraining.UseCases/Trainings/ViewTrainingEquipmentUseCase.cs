using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class ViewTrainingEquipmentUseCase(ITrainingRepository trainingRepository) : IViewTrainingEquipmentUseCase
    {
        public async Task<List<string?>> ExecuteAsync(int trainingId)
        {
            return await trainingRepository.GetEquipmentByTrainingIdAsync(trainingId);
        }

    }
}
