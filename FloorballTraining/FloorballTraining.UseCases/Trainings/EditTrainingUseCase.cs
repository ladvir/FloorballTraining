using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class EditTrainingUseCase : IEditTrainingUseCase
    {
        private readonly ITrainingRepository _trainingRepository;

        public EditTrainingUseCase(ITrainingRepository trainingRepository)
        {
            _trainingRepository = trainingRepository;
        }

        public async Task ExecuteAsync(Training training)
        {
            await _trainingRepository.UpdateTrainingAsync(training);
        }
    }
}
