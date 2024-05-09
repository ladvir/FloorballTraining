using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams
{
    public class DeleteTeamUseCase : IDeleteTeamUseCase
    {
        private readonly ITeamRepository _teamRepository;

        public DeleteTeamUseCase(ITeamRepository teamRepository)
        {
            _teamRepository = teamRepository;
        }

        public async Task ExecuteAsync(int teamId)
        {
            await _teamRepository.DeleteTeamAsync(teamId);
        }
    }
}
