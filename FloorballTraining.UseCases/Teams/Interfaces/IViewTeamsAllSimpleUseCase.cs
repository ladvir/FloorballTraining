using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Teams.Interfaces;

public interface IViewTeamsAllSimpleUseCase
{
    Task<IReadOnlyList<TeamDto>> ExecuteAsync();
}