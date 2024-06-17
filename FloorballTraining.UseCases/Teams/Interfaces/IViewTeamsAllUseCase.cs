using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Teams.Interfaces
{
    public interface IViewTeamsAllUseCase
    {
        Task<IReadOnlyList<TeamDto>> ExecuteAsync();
    }
}