using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities;

public interface IDeleteActivityUseCase
{
    Task ExecuteAsync(Activity activity);
}