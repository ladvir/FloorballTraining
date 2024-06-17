namespace FloorballTraining.UseCases.Teams.Interfaces;

public interface IDeleteTeamUseCase
{
    Task ExecuteAsync(int teamId);
}