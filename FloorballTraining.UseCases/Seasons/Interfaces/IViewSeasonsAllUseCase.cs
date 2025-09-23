using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Seasons.Interfaces;

public interface IViewSeasonsAllUseCase
{
    Task<IReadOnlyList<SeasonDto>> ExecuteAsync();
}