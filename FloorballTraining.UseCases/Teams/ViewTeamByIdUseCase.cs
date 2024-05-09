using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams;

public class ViewTeamByIdUseCase : IViewTeamByIdUseCase
{
    private readonly ITeamRepository _teamRepository;
    private readonly IMapper _mapper;

    public ViewTeamByIdUseCase(ITeamRepository teamRepository, IMapper mapper)
    {
        _teamRepository = teamRepository;
        _mapper = mapper;
    }

    public async Task<TeamDto?> ExecuteAsync(int teamId)
    {
        var team = await _teamRepository.GetTeamByIdAsync(teamId);

        return _mapper.Map<Team?, TeamDto>(team);
    }
}