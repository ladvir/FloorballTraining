using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Teams.Interfaces
{
    public interface IViewTeamsWithSpecificationUseCase
    {
        Task<IReadOnlyList<TeamDto>?> ViewAsync(TeamSpecificationParameters parameters);
        Task<Pagination<TeamDto>> ViewPaginatedAsync(TeamSpecificationParameters parameters);
    }
}