using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings;

public class ViewTrainingsAllUseCase(ITrainingRepository repository, AppMapper mapper) : IViewTrainingsAllUseCase
{
    public async Task<IReadOnlyList<TrainingDto>> ExecuteAsync()
    {
        var items = await repository.GetAllAsync();

        return mapper.ToTrainingDtos(items);
    }
}