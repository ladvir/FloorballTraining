using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Teams.Interfaces;

public interface IViewTeamByIdUseCase
{
    Task<TeamDto?> ExecuteAsync(int teamId);
}