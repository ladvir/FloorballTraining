using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Members
{
    public class EditMemberUseCase(IMemberRepository memberRepository, IMemberFactory memberFactory) : IEditMemberUseCase
    {
        public async Task ExecuteAsync(MemberDto memberDto)
        {
            var member = await memberFactory.GetMergedOrBuild(memberDto);

            await memberRepository.UpdateMemberAsync(member).ConfigureAwait(false);
        }
    }
}
