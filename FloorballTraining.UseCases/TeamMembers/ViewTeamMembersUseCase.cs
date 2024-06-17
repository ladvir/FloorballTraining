using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.TeamMembers.Interfaces;

namespace FloorballTraining.UseCases.TeamMembers;

public class ViewTeamMembersWithSpecificationUseCase(
    ITeamMemberRepository repository,
    IMapper mapper) : IViewTeamMembersWithSpecificationUseCase
{
    public async Task<Pagination<TeamMemberDto>> ViewPaginatedAsync(TeamMemberSpecificationParameters parameters)
    {
        var countSpecification = new TeamMembersWithFilterForCountSpecification(parameters);

        var totalItems = await repository.CountAsync(countSpecification);

        var data = await ViewAsync(parameters);

        return new Pagination<TeamMemberDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }

    public async Task<IReadOnlyList<TeamMemberDto>?> ViewAsync(TeamMemberSpecificationParameters parameters)
    {
        var specification = new TeamMembersSpecification(parameters);
        var items = await repository.GetListAsync(specification);
        return mapper.Map<IReadOnlyList<TeamMember>, IReadOnlyList<TeamMemberDto>>(items);

    }
}