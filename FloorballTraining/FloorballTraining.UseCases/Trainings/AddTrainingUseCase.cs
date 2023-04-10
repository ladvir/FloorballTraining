using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class AddTrainingUseCase : IAddTrainingUseCase
    {
        private readonly ITrainingRepository _trainingRepository;

        public AddTrainingUseCase(ITrainingRepository trainingRepository)
        {
            _trainingRepository = trainingRepository;
        }

        public async Task ExecuteAsync(Training training)
        {
            await _trainingRepository.AddTrainingAsync(training);
        }
    }
}
