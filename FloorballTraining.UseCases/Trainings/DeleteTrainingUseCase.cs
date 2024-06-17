using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings;

public class DeleteTrainingUseCase(ITrainingRepository repository) : IDeleteTrainingUseCase
{
    public async Task ExecuteAsync(int id)
    {
        await repository.DeleteAsync(id);
    }
}