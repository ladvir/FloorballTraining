using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Clubs.Interfaces
{
    public interface IViewClubsUseCase
    {
        Task<Pagination<ClubDto>> ExecuteAsync(ClubSpecificationParameters parameters);
    }
}