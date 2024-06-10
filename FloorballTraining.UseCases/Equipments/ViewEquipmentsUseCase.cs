using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments;

public class ViewEquipmentsUseCase(
    IEquipmentRepository equipmentRepository,
    IMapper mapper)
    : IViewEquipmentsUseCase
{
    public async Task<Pagination<EquipmentDto>> ExecuteAsync(EquipmentSpecificationParameters parameters)
    {
        var specification = new EquipmentsSpecification(parameters);

        var countSpecification = new EquipmentsWithFilterForCountSpecification(parameters);

        var totalItems = await equipmentRepository.CountAsync(countSpecification);

        var equipments = await equipmentRepository.GetListAsync(specification);

        var data = mapper.Map<IReadOnlyList<Equipment>, IReadOnlyList<EquipmentDto>>(equipments);

        return new Pagination<EquipmentDto>(parameters.PageIndex, parameters.PageSize, totalItems, data);
    }
}
public class ViewEquipmentsAllUseCase(
    IEquipmentRepository equipmentRepository,
    IMapper mapper)
    : IViewEquipmentsAllUseCase
{
    public async Task<IReadOnlyList<EquipmentDto>> ExecuteAsync()
    {
        var equipments = await equipmentRepository.GetAllAsync();

        return mapper.Map<IReadOnlyList<Equipment>, IReadOnlyList<EquipmentDto>>(equipments);
    }
}