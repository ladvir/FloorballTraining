using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Members
{
    public class DeleteMemberUseCase(IMemberRepository memberRepository) : IDeleteMemberUseCase
    {
        public async Task ExecuteAsync(MemberDto memberDto)
        {
            var member = await memberRepository.GetByIdAsync(memberDto.Id);

            if (member == null)
            {
                return;
            }

            await memberRepository.DeleteMemberAsync(member);
        }
    }
}
