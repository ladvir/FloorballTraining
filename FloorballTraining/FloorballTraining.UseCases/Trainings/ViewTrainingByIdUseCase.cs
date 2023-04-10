using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class ViewTrainingByIdUseCase : IViewTrainingByIdUseCase
    {
        private readonly ITrainingRepository _trainingRepository;

        public ViewTrainingByIdUseCase(ITrainingRepository trainingRepository)
        {
            _trainingRepository = trainingRepository;
        }

        public async Task<Training> ExecuteAsync(int trainingId)
        {
            return await _trainingRepository.GetTrainingByIdAsync(trainingId);
        }
    }
}
