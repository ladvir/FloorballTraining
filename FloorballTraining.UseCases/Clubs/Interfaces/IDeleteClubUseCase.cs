namespace FloorballTraining.UseCases.Clubs.Interfaces;

public interface IDeleteClubUseCase
{
    Task ExecuteAsync(int clubId);
}