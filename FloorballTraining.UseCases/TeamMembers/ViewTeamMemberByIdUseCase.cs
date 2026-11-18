using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.TeamMembers.Interfaces;

namespace FloorballTraining.UseCases.TeamMembers;

public class ViewTeamMemberByIdUseCase(ITeamMemberRepository memberRepository, AppMapper mapper) : IViewTeamMemberByIdUseCase
{
    public async Task<TeamMemberDto?> ExecuteAsync(int memberId)
    {
        var member = await memberRepository.GetWithSpecification(new TeamMembersSpecification(new TeamMemberSpecificationParameters { Id = memberId }));

        return member == null ? null : mapper.ToTeamMemberDto(member);
    }
}