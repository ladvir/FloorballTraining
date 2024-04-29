using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams;

public class ViewTeamsWithSpecificationUseCase : IViewTeamsWithSpecificationUseCase
{
    private readonly ITeamRepository _repository;
    private readonly IMapper _mapper;

    public ViewTeamsWithSpecificationUseCase(
        ITeamRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<Pagination<TeamDto>> ViewPaginatedAsync(TeamSpecificationParameters parameters)
    {
        var countSpecification = new TeamsForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var data = await ViewAsync(parameters);

        return new Pagination<TeamDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }

    public async Task<IReadOnlyList<TeamDto>?> ViewAsync(TeamSpecificationParameters parameters)
    {
        var specification = new TeamsSpecification(parameters);
        var items = await _repository.GetListAsync(specification);
        return _mapper.Map<IReadOnlyList<Team>, IReadOnlyList<TeamDto>>(items);

    }
}