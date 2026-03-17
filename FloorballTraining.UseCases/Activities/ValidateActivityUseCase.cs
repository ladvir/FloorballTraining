using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Activities;

public class ValidateActivityUseCase(
    IViewActivityByIdUseCase viewActivityByIdUseCase,
    IActivityRepository activityRepository)
    : IValidateActivityUseCase
{
    public async Task<ActivityDto> ExecuteAsync(int id)
    {
        var dto = await viewActivityByIdUseCase.ExecuteAsync(id)
                  ?? throw new Exception($"Aktivita s id {id} nenalezena");

        var validator = new ActivityValidator();
        var result = await validator.ValidateAsync(dto);

        dto.IsDraft = !result.IsValid;
        dto.ValidationErrors = result.Errors.Select(e => e.ErrorMessage).ToList();

        await activityRepository.UpdateIsDraftAsync(id, dto.IsDraft);

        return dto;
    }
}
