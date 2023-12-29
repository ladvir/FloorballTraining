using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.AgeGroups;

public interface IViewAgeGroupsAllUseCase
{
    Task<IReadOnlyList<AgeGroupDto>> ExecuteAsync();
}