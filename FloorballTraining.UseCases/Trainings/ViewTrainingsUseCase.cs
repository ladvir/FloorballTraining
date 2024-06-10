using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Trainings;

public class ViewTrainingsUseCase(
    ITrainingRepository repository,
    IMapper mapper) : IViewTrainingsUseCase
{
    public async Task<Pagination<TrainingDto>> ExecuteAsync(TrainingSpecificationParameters parameters)
    {
        var specification = new TrainingsSpecification(parameters);

        var countSpecification = new TrainingsForCountSpecification(parameters);

        var totalItems = await repository.CountAsync(countSpecification);

        var items = await repository.GetListAsync(specification);

        var data = mapper.Map<IReadOnlyList<Training>, IReadOnlyList<TrainingDto>>(items);

        return new Pagination<TrainingDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}