using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings;

public class DeleteTrainingUseCase : IDeleteTrainingUseCase
{
    private readonly ITrainingRepository _repository;

    public DeleteTrainingUseCase(ITrainingRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(int id)
    {
        await _repository.DeleteAsync(id);
    }
}