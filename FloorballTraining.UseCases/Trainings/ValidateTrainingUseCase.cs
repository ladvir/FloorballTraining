using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Validations;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings;

public class ValidateTrainingUseCase(
    IViewTrainingByIdUseCase viewTrainingByIdUseCase,
    ITrainingRepository trainingRepository)
    : IValidateTrainingUseCase
{
    public async Task<TrainingDto> ExecuteAsync(int id, int? minPartsDurationPercent = null)
    {
        var dto = await viewTrainingByIdUseCase.ExecuteAsync(id)
                  ?? throw new Exception($"Trénink s id {id} nenalezen");

        var percent = minPartsDurationPercent
                      ?? await trainingRepository.GetMinPartsDurationPercentAsync(id);

        var validator = new TrainingValidator(minPartsDurationPercent: percent);
        var result = await validator.ValidateAsync(dto);

        dto.IsDraft = !result.IsValid;
        dto.ValidationErrors = result.Errors.Select(e => e.ErrorMessage).ToList();

        await trainingRepository.UpdateIsDraftAsync(id, dto.IsDraft);

        return dto;
    }
}
