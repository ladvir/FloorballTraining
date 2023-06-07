using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Activities;

public interface ICloneActivityUseCase
{
    Task<Activity> ExecuteAsync(Activity activity);
}