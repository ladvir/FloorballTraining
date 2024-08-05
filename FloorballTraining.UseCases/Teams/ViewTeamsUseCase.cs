using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;

namespace FloorballTraining.UseCases.Teams;

public class ViewTeamsWithSpecificationUseCase(
    ITeamRepository repository,
    IMapper mapper) : IViewTeamsWithSpecificationUseCase
{
    public async Task<Pagination<TeamDto>> ExecuteAsync(TeamSpecificationParameters parameters)
    {
        var countSpecification = new TeamsForCountSpecification(parameters);

        var totalItems = await repository.CountAsync(countSpecification);

        var data = await ViewAsync(parameters);

        return new Pagination<TeamDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }

    public async Task<IReadOnlyList<TeamDto>?> ViewAsync(TeamSpecificationParameters parameters)
    {
        var specification = new TeamsSpecification(parameters);
        var items = await repository.GetListAsync(specification);
        return mapper.Map<IReadOnlyList<Team>, IReadOnlyList<TeamDto>>(items);

    }
}