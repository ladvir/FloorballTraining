using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams
{
    public class EditTeamUseCase : IEditTeamUseCase
    {
        private readonly ITeamRepository _teamRepository;
        private readonly ITeamFactory _teamFactory;

        public EditTeamUseCase(ITeamRepository teamRepository, ITeamFactory teamFactory)
        {
            _teamRepository = teamRepository;
            _teamFactory = teamFactory;
        }

        public async Task ExecuteAsync(TeamDto teamDto)
        {
            var team = await _teamFactory.GetMergedOrBuild(teamDto);
            await _teamRepository.UpdateTeamAsync(team);
        }
    }
}
