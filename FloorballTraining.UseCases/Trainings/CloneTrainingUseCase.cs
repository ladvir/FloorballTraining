using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class CloneTrainingUseCase(ITrainingRepository trainingRepository) : ICloneTrainingUseCase
    {
        public async Task<Training> ExecuteAsync(int trainingId)
        {
            return await trainingRepository.CloneTrainingAsync(trainingId);
        }
    }
}
