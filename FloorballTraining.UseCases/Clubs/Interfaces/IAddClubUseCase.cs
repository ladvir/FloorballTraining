using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Clubs.Interfaces
{
    public interface IAddClubUseCase
    {
        Task ExecuteAsync(ClubDto clubDto);
    }
}