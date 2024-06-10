using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments;

public class ViewEquipmentByIdUseCase(IEquipmentRepository equipmentRepository, IMapper mapper)
    : IViewEquipmentByIdUseCase
{
    public async Task<EquipmentDto?> ExecuteAsync(int equipmentId)
    {
        var equipment = await equipmentRepository.GetByIdAsync(equipmentId);

        return equipment == null ? null : mapper.Map<Equipment, EquipmentDto>(equipment);
    }
}