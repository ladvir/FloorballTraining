using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Trainings
{
    public class AddTrainingUseCase : IAddTrainingUseCase
    {
        private readonly ITrainingRepository _trainingRepository;
        private readonly ITrainingFactory _trainingFactory;

        public AddTrainingUseCase(ITrainingRepository trainingRepository, ITrainingFactory trainingFactory)
        {
            _trainingRepository = trainingRepository;
            _trainingFactory = trainingFactory;
        }

        public async Task ExecuteAsync(TrainingDto dto)
        {
            var entity = await _trainingFactory.GetMergedOrBuild(dto);
            await _trainingRepository.AddTrainingAsync(entity);
        }
    }
}
