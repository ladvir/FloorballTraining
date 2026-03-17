using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Activities
{
    public class EditActivityUseCase(IActivityRepository activityRepository, IActivityFactory activityFactory)
        : IEditActivityUseCase
    {
        public async Task ExecuteAsync(ActivityDto activityDto)
        {
            var validator = new ActivityValidator();
            var result = await validator.ValidateAsync(activityDto);
            activityDto.IsDraft = !result.IsValid;
            activityDto.ValidationErrors = result.Errors.Select(e => e.ErrorMessage).ToList();

            var activity = await activityFactory.GetMergedOrBuild(activityDto);

            await activityRepository.UpdateActivityAsync(activity);
        }
    }
}
