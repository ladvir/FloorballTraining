using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Equipments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments;

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