using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags.Interfaces;

public interface IAddTagUseCase
{
    Task ExecuteAsync(Tag tag);
}