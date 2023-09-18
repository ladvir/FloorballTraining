using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags;

public interface IDeleteTagUseCase
{
    Task ExecuteAsync(Tag tag);
}