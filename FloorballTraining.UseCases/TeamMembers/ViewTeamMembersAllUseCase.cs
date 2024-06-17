using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.TeamMembers.Interfaces;

namespace FloorballTraining.UseCases.TeamMembers;

public class ViewTeamMembersAllUseCase(
ITeamMemberRepository repository,
    IMapper mapper) : IViewTeamMembersAllUseCase
{
    public async Task<IReadOnlyList<TeamMemberDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.Map<IReadOnlyList<TeamMember>, IReadOnlyList<TeamMemberDto>>(items);
    }
}
