using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams
{
    public class AddTeamUseCase(ITeamRepository teamRepository, ITeamFactory teamFactory) : IAddTeamUseCase
    {
        public async Task ExecuteAsync(TeamDto teamDto)
        {
            var team = await teamFactory.GetMergedOrBuild(teamDto);
            await teamRepository.AddTeamAsync(team);

            teamDto.Id = team.Id;
        }
    }
}
