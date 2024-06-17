using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams;

public class ViewTeamsAllUseCase(
    ITeamRepository repository,
    IMapper mapper) : IViewTeamsAllUseCase
{
    public async Task<IReadOnlyList<TeamDto>> ExecuteAsync()
    {
        var items = await repository.GetAllTeamsAsync();

        return mapper.Map<IReadOnlyList<Team>, IReadOnlyList<TeamDto>>(items);
    }
}
