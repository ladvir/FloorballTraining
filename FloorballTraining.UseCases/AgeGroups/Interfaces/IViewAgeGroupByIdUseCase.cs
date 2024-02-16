using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.AgeGroups;

public interface IViewAgeGroupByIdUseCase
{
    Task<AgeGroupDto> ExecuteAsync(int placeId);
}