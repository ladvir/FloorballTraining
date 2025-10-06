using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.TeamMembers.Interfaces;

namespace FloorballTraining.UseCases.TeamMembers
{
    public class DeleteTeamMemberUseCase(ITeamMemberRepository memberRepository) : IDeleteTeamMemberUseCase
    {
        public async Task ExecuteAsync(int memberId)
        {
            var member = await memberRepository.GetByIdAsync(memberId);

            if (member == null)
            {
                return;
            }

            await memberRepository.DeleteTeamMemberAsync(member);
        }
    }
}
