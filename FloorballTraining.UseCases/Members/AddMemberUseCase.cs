using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.UseCases.Members
{
    public class AddTeamUseCase : IAddMemberUseCase
    {
        private readonly IMemberRepository _memberRepository;
        private readonly IMemberFactory _memberFactory;

        public AddTeamUseCase(IMemberRepository memberRepository, IMemberFactory memberFactory)
        {
            _memberRepository = memberRepository;
            _memberFactory = memberFactory;
        }

        public async Task ExecuteAsync(MemberDto memberDto)
        {
            var member = await _memberFactory.GetMergedOrBuild(memberDto);
            await _memberRepository.AddMemberAsync(member);
        }
    }
}
