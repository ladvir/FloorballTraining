using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.TeamMembers.Interfaces;

namespace FloorballTraining.UseCases.TeamMembers
{
    public class DeleteTeamMemberUseCase(ITeamMemberRepository memberRepository) : IDeleteTeamMemberUseCase
    {
        public async Task ExecuteAsync(TeamMemberDto memberDto)
        {
            var member = await memberRepository.GetByIdAsync(memberDto.Id);

            if (member == null)
            {
                return;
            }

            await memberRepository.DeleteTeamMemberAsync(member);
        }
    }
}
