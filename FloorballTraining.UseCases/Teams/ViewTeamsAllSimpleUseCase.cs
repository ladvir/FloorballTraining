using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams;

public class ViewTeamsAllSimpleUseCase(
    ITeamRepository repository,
    IMapper mapper) : IViewTeamsAllSimpleUseCase
{
    public async Task<IReadOnlyList<TeamDto>> ExecuteAsync()
    {
        var items = await repository.GetAllSimpleAsync();

        return mapper.Map<IReadOnlyList<Team>, IReadOnlyList<TeamDto>>(items);
    }
}