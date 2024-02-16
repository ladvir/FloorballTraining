using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Trainings
{
    public class EditTrainingUseCase : IEditTrainingUseCase
    {
        private readonly ITrainingRepository _trainingRepository;
        private readonly ITrainingFactory _trainingFactory;

        public EditTrainingUseCase(ITrainingRepository trainingRepository, ITrainingFactory trainingFactory)
        {
            _trainingRepository = trainingRepository;
            _trainingFactory = trainingFactory;
        }

        public async Task ExecuteAsync(TrainingDto dto)
        {
            var entity = await _trainingFactory.GetMergedOrBuild(dto);
            await _trainingRepository.UpdateTrainingAsync(entity);
        }
    }
}
