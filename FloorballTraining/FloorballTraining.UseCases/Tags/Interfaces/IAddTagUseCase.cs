using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags;

public interface IAddTagUseCase
{
    Task ExecuteAsync(Tag tag);
}