using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.TeamMembers.Interfaces;

namespace FloorballTraining.UseCases.TeamMembers;

public class ViewTeamMembersAllUseCase(
ITeamMemberRepository repository,
    AppMapper mapper) : IViewTeamMembersAllUseCase
{
    public async Task<IReadOnlyList<TeamMemberDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.ToTeamMemberDtos(items);
    }
}
