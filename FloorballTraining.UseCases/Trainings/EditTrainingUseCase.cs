using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Trainings
{
    public class EditTrainingUseCase(ITrainingRepository trainingRepository, ITrainingFactory trainingFactory)
        : IEditTrainingUseCase
    {
        public async Task ExecuteAsync(TrainingDto dto)
        {
            var percent = await trainingRepository.GetMinPartsDurationPercentAsync(dto.Id);
            var validator = new TrainingValidator(minPartsDurationPercent: percent);
            var result = await validator.ValidateAsync(dto);
            dto.IsDraft = !result.IsValid;
            dto.ValidationErrors = result.Errors.Select(e => e.ErrorMessage).ToList();

            var entity = await trainingFactory.GetMergedOrBuild(dto);
            await trainingRepository.UpdateTrainingAsync(entity);
        }
    }
}
