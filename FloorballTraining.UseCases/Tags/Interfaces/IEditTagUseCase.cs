using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Tags;

public interface IEditTagUseCase
{
    Task ExecuteAsync(TagDto tag);
}