namespace FloorballTraining.UseCases.Seasons.Interfaces;

public interface IDeleteSeasonUseCase
{
    Task ExecuteAsync(int seasonId);
}