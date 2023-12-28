using AutoMapper;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.AgeGroups;

public class ViewAgeGroupByIdUseCase : IViewAgeGroupByIdUseCase
{
    private readonly IAgeGroupRepository _repository;
    private readonly IMapper _mapper;

    public ViewAgeGroupByIdUseCase(IAgeGroupRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<AgeGroupDto> ExecuteAsync(int id)
    {
        var specification = new AgeGroupsSpecification(id);

        var item = await _repository.GetWithSpecification(specification);

        return _mapper.Map<CoreBusiness.AgeGroup?, AgeGroupDto>(item);


    }
}