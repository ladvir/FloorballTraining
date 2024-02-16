namespace FloorballTraining.UseCases.Tags;

public interface IDeleteTagUseCase
{
    Task ExecuteAsync(int tagId);
}