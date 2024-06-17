using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Clubs.Interfaces;

public interface IEditClubUseCase
{
    Task ExecuteAsync(ClubDto clubDto);
}