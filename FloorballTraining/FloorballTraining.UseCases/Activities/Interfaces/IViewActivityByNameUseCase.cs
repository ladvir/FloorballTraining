using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities
{
    public interface IViewActivityByNameUseCase
    {
        Task<IEnumerable<Activity>> ExecuteAsync(string searchString = "");
    }
}
