using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Tags
{
    public interface IViewTagByNameUseCase
    {
        Task<IReadOnlyList<TagDto>> ExecuteAsync(string? searchString, bool? trainingGoalsOnly);
    }
    public interface IViewTagsUseCase
    {
        Task<IReadOnlyList<TagDto>> ExecuteAsync();
    }
}
