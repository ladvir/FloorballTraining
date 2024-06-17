using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Teams.Interfaces;

public interface IEditTeamUseCase
{
    Task ExecuteAsync(TeamDto teamDto);
}