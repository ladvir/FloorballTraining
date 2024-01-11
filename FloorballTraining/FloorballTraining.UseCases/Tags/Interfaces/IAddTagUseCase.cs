using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Tags;

public interface IAddTagUseCase
{
    Task ExecuteAsync(TagDto tag);
}