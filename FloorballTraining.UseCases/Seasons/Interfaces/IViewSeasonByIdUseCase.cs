using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Seasons.Interfaces;

public interface IViewSeasonByIdUseCase
{
    Task<SeasonDto?> ExecuteAsync(int seasonId);
}