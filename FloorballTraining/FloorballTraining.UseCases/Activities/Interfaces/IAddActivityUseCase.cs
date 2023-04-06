using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities;

public interface IAddActivityUseCase
{
    Task ExecuteAsync(Activity activity);
}