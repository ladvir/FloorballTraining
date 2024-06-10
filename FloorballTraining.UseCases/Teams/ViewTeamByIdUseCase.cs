using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams;

public class ViewTeamByIdUseCase(ITeamRepository teamRepository, IMapper mapper) : IViewTeamByIdUseCase
{
    public async Task<TeamDto?> ExecuteAsync(int teamId)
    {
        var team = await teamRepository.GetTeamByIdAsync(teamId);

        return mapper.Map<Team?, TeamDto>(team);
    }
}