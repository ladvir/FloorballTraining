using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Clubs.Interfaces
{
    public interface IViewClubsAllUseCase
    {
        Task<IReadOnlyList<ClubDto>> ExecuteAsync();
    }
}