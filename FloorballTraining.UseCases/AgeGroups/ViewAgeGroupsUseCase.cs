using AutoMapper;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewAgeGroupsUseCase : IViewAgeGroupsUseCase
{
    private readonly IAgeGroupRepository _repository;
    private readonly IMapper _mapper;

    public ViewAgeGroupsUseCase(
        IAgeGroupRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<Pagination<AgeGroupDto>> ExecuteAsync(AgeGroupSpecificationParameters parameters)
    {
        var specification = new AgeGroupsSpecification(parameters);

        var countSpecification = new AgeGroupsForCountSpecification(parameters);

        var totalItems = await _repository.CountAsync(countSpecification);

        var items = await _repository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<CoreBusiness.AgeGroup>, IReadOnlyList<AgeGroupDto>>(items);

        return new Pagination<AgeGroupDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}