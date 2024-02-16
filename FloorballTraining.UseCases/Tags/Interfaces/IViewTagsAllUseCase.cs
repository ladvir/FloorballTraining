using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Tags;

public interface IViewTagsAllUseCase
{
    Task<IReadOnlyList<TagDto>> ExecuteAsync();
}