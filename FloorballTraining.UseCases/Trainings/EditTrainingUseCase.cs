using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Trainings
{
    public class EditTrainingUseCase(ITrainingRepository trainingRepository, ITrainingFactory trainingFactory)
        : IEditTrainingUseCase
    {
        public async Task ExecuteAsync(TrainingDto dto)
        {
            var entity = await trainingFactory.GetMergedOrBuild(dto);
            await trainingRepository.UpdateTrainingAsync(entity);
        }
    }
}
