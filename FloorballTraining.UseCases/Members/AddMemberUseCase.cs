using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Members
{
    public class AddMemberUseCase(IMemberRepository memberRepository, IMemberFactory memberFactory) : IAddMemberUseCase
    {
        public async Task ExecuteAsync(MemberDto memberDto)
        {
            var member = await memberFactory.GetMergedOrBuild(memberDto);
            await memberRepository.AddMemberAsync(member);

            memberDto.Id = member.Id;

        }
    }
}
