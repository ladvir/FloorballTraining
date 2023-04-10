using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Trainings;

public interface IViewTrainingByNameUseCase
{
    Task<IEnumerable<Training>> ExecuteAsync(string searchString = "");
}