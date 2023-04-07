using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities;

public interface IEditActivityUseCase
{
    Task ExecuteAsync(Activity activity);
}