using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings;

public class ViewTrainingsUseCase : IViewTrainingsUseCase
{
    private readonly ITrainingRepository _repository;
    private readonly IMapper _mapper;

    public ViewTrainingsUseCase(
        ITrainingRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<Pagination<TrainingDto>> ExecuteAsync(TrainingSpecificationParameters parameters)
    {
        var specification = new TrainingsSpecification(parameters);

        var countSpecification = new TrainingsForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var items = await _repository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<Training>, IReadOnlyList<TrainingDto>>(items);

        return new Pagination<TrainingDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}