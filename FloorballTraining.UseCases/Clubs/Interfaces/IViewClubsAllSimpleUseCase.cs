using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Clubs;

public interface IViewClubsAllSimpleUseCase
{
    Task<IReadOnlyList<ClubDto>> ExecuteAsync();
}