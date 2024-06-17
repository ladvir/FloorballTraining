using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Teams.Interfaces
{
    public interface IAddTeamUseCase
    {
        Task ExecuteAsync(TeamDto teamDto);
    }
}