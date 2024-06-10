using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Trainings
{
    public class CloneTrainingUseCase(ITrainingRepository trainingRepository, ITrainingFactory trainingFactory)
        : ICloneTrainingUseCase
    {
        private readonly ITrainingFactory _trainingFactory = trainingFactory;

        public async Task<Training> ExecuteAsync(int trainingId)
        {
            return await trainingRepository.CloneTrainingAsync(trainingId);
        }
    }
}
