using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Trainings
{
    public class CloneTrainingUseCase : ICloneTrainingUseCase
    {
        private readonly ITrainingRepository _trainingRepository;
        private readonly ITrainingFactory _trainingFactory;

        public CloneTrainingUseCase(ITrainingRepository trainingRepository, ITrainingFactory trainingFactory)
        {
            _trainingRepository = trainingRepository;
            _trainingFactory = trainingFactory;
        }

        public async Task<Training> ExecuteAsync(int trainingId)
        {
            return await _trainingRepository.CloneTrainingAsync(trainingId);
        }
    }
}
