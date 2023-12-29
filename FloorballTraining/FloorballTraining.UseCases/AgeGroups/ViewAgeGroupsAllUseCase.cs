using AutoMapper;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.AgeGroups;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Places;

public class ViewAgeGroupsAllUseCase : IViewAgeGroupsAllUseCase
{
    private readonly IAgeGroupRepository _repository;
    private readonly IMapper _mapper;

    public ViewAgeGroupsAllUseCase(
        IAgeGroupRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<AgeGroupDto>> ExecuteAsync()
    {
        var items = await _repository.GetAllAsync();

        return _mapper.Map<IReadOnlyList<CoreBusiness.AgeGroup>, IReadOnlyList<AgeGroupDto>>(items);


    }
}