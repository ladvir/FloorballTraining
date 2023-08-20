using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Tags
{
    public interface IViewTagByNameUseCase
    {
        Task<IEnumerable<Tag>> ExecuteAsync(string searchString = "", bool trainingGoalsOnly=false);
    }
}
