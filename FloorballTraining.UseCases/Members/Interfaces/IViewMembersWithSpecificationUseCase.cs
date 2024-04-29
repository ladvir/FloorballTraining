using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Members.Interfaces
{
    public interface IViewMembersWithSpecificationUseCase
    {
        Task<IReadOnlyList<MemberDto>?> ViewAsync(MemberSpecificationParameters parameters);
        Task<Pagination<MemberDto>> ViewPaginatedAsync(MemberSpecificationParameters parameters);
    }
}