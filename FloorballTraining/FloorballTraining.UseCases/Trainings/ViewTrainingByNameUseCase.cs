using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings
{
    public class ViewTrainingByNameUseCase : IViewTrainingByNameUseCase
    {
        private readonly ITrainingRepository _trainingRepository;

        public ViewTrainingByNameUseCase(ITrainingRepository trainingRepository)
        {
            _trainingRepository = trainingRepository;
        }

        public async Task<IEnumerable<Training>> ExecuteAsync(string searchString = "")
        {
            return await _trainingRepository.GetTrainingsByNameAsync(searchString);
        }
    }
}
