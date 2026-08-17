using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Seasons.Interfaces;

public interface IViewSeasonsAllUseCase
{
    Task<IReadOnlyList<SeasonDto>> ExecuteAsync();
    Task<IReadOnlyList<SeasonDto>> ExecuteAsync(int? clubId);
}