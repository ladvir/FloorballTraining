using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Members;

public class ViewMemberByIdUseCase(IMemberRepository memberRepository, IMapper mapper)
    : IViewMemberByIdUseCase
{
    public async Task<MemberDto?> ExecuteAsync(int memberId)
    {
        var member = await memberRepository.GetWithSpecification(new MembersSpecification(new MemberSpecificationParameters { Id = memberId }));

        return member == null ? null : mapper.Map<Member, MemberDto>(member);
    }
}