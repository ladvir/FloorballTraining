using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Seasons.Interfaces;

public interface IEditSeasonUseCase
{
    Task ExecuteAsync(SeasonDto season);
}