using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Trainings
{
    public class AddTrainingUseCase(ITrainingRepository trainingRepository, ITrainingFactory trainingFactory)
        : IAddTrainingUseCase
    {
        public async Task ExecuteAsync(TrainingDto dto)
        {
            var entity = await trainingFactory.GetMergedOrBuild(dto);
            await trainingRepository.AddTrainingAsync(entity);

            dto.Id = entity.Id;
        }
    }
}
