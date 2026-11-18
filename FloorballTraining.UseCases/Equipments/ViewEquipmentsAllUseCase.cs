using FloorballTraining.UseCases.Helpers;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Equipments.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments;

public class ViewEquipmentsAllUseCase(
    IEquipmentRepository equipmentRepository,
    AppMapper mapper)
    : IViewEquipmentsAllUseCase
{
    public async Task<IReadOnlyList<EquipmentDto>> ExecuteAsync()
    {
        var equipments = await equipmentRepository.GetAllAsync();

        return mapper.ToEquipmentDtos(equipments);
    }
}