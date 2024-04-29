using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams
{
    public class AddTeamUseCase : IAddTeamUseCase
    {
        private readonly ITeamRepository _teamRepository;
        private readonly ITeamFactory _teamFactory;

        public AddTeamUseCase(ITeamRepository teamRepository, ITeamFactory teamFactory)
        {
            _teamRepository = teamRepository;
            _teamFactory = teamFactory;
        }

        public async Task ExecuteAsync(TeamDto teamDto)
        {
            var team = await _teamFactory.GetMergedOrBuild(teamDto);
            await _teamRepository.AddTeamAsync(team);
        }
    }
}
