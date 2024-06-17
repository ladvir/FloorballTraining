using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Clubs.Interfaces;

public interface IViewClubByIdUseCase
{
    Task<ClubDto> ExecuteAsync(int clubId);
}