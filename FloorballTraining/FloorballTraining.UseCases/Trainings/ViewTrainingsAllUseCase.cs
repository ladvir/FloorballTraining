using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings;

public class ViewTrainingsAllUseCase : IViewTrainingsAllUseCase
{
    private readonly ITrainingRepository _repository;
    private readonly IMapper _mapper;

    public ViewTrainingsAllUseCase(ITrainingRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<TrainingDto?>> ExecuteAsync()
    {
        var items = await _repository.GetAllAsync();

        return _mapper.Map<IReadOnlyList<Training>, IReadOnlyList<TrainingDto>>(items);
    }
}