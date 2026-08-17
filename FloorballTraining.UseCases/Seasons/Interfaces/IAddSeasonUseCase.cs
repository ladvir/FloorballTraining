using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Seasons.Interfaces;

public interface IAddSeasonUseCase
{
    Task ExecuteAsync(SeasonDto season);
}