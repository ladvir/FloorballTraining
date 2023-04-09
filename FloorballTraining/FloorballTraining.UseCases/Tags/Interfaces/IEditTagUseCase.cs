using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags;

public interface IEditTagUseCase
{
    Task ExecuteAsync(Tag tag);
}