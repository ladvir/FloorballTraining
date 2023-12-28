using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments;

public class ViewEquipmentsUseCase : IViewEquipmentsUseCase
{
    private readonly IEquipmentRepository _equipmentRepository;
    private readonly IMapper _mapper;

    public ViewEquipmentsUseCase(
        IEquipmentRepository equipmentRepository,
        IMapper mapper)
    {
        _equipmentRepository = equipmentRepository;
        _mapper = mapper;
    }

    public async Task<Pagination<EquipmentDto>> ExecuteAsync(EquipmentSpecificationParameters parameters)
    {
        var specification = new EquipmentsSpecification(parameters);

        var countSpecification = new EquipmentsWithFilterForCountSpecification(parameters);

        var totalItems = await _equipmentRepository.CountAsync(countSpecification);

        var equipments = await _equipmentRepository.GetListAsync(specification);

        var data = _mapper.Map<IReadOnlyList<Equipment>, IReadOnlyList<EquipmentDto>>(equipments);

        return new Pagination<EquipmentDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}