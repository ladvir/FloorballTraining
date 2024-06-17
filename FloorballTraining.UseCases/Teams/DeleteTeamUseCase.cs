using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams
{
    public class DeleteTeamUseCase(ITeamRepository teamRepository) : IDeleteTeamUseCase
    {
        public async Task ExecuteAsync(int teamId)
        {
            await teamRepository.DeleteTeamAsync(teamId);
        }
    }
}
