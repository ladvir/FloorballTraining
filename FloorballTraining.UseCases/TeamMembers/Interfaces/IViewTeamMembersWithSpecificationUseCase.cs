using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.TeamMembers.Interfaces
{
    public interface IViewTeamMembersWithSpecificationUseCase
    {
        Task<IReadOnlyList<TeamMemberDto>?> ViewAsync(TeamMemberSpecificationParameters parameters);
        Task<Pagination<TeamMemberDto>> ViewPaginatedAsync(TeamMemberSpecificationParameters parameters);
    }
}