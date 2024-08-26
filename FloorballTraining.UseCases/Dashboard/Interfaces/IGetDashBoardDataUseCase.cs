using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Dashboard.Interfaces;

public interface IGetDashBoardDataUseCase
{
    Task<DashBoardDataDto> ExecuteAsync();
}