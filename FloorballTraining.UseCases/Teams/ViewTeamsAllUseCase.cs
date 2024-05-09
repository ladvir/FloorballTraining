using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams;

public class ViewTeamsAllUseCase : IViewTeamsAllUseCase
{
    private readonly ITeamRepository _repository;
    private readonly IMapper _mapper;

    public ViewTeamsAllUseCase(
        ITeamRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<TeamDto>> ExecuteAsync()
    {
        var items = await _repository.GetAllTeamsAsync();

        return _mapper.Map<IReadOnlyList<Team>, IReadOnlyList<TeamDto>>(items);
    }
}
