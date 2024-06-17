using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.TeamMembers.Interfaces;

namespace FloorballTraining.UseCases.TeamMembers
{
    public class AddTeamMemberUseCase(ITeamMemberRepository memberRepository, ITeamMemberFactory memberFactory) : IAddTeamMemberUseCase
    {
        public async Task ExecuteAsync(TeamMemberDto memberDto)
        {
            var member = await memberFactory.GetMergedOrBuild(memberDto);
            await memberRepository.AddTeamMemberAsync(member);

            memberDto.Id = member.Id;

        }
    }
}
