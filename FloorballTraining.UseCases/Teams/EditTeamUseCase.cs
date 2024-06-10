using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams
{
    public class EditTeamUseCase(ITeamRepository teamRepository, ITeamFactory teamFactory) : IEditTeamUseCase
    {
        public async Task ExecuteAsync(TeamDto teamDto)
        {
            var team = await teamFactory.GetMergedOrBuild(teamDto);
            await teamRepository.UpdateTeamAsync(team);
        }
    }
}
