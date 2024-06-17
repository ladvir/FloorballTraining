using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.TeamMembers.Interfaces;

namespace FloorballTraining.UseCases.TeamMembers
{
    public class EditTeamMemberUseCase(ITeamMemberRepository memberRepository, ITeamMemberFactory memberFactory) : IEditTeamMemberUseCase
    {
        public async Task ExecuteAsync(TeamMemberDto memberDto)
        {
            var member = await memberFactory.GetMergedOrBuild(memberDto);

            await memberRepository.UpdateTeamMemberAsync(member).ConfigureAwait(false);
        }
    }
}
