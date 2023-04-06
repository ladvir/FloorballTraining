using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags.Interfaces
{
    public interface IViewTagByNameUseCase
    {
        Task<IEnumerable<Tag>> ExecuteAsync(string searchString = "");
    }
}
