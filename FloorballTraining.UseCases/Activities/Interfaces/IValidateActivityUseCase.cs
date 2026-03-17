using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Activities.Interfaces;

public interface IValidateActivityUseCase
{
    Task<ActivityDto> ExecuteAsync(int id);
}
