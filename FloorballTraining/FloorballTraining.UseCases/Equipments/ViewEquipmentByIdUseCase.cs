using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments;

public class ViewEquipmentByIdUseCase : IViewEquipmentByIdUseCase
{
    private readonly IEquipmentRepository _equipmentRepository;

    public ViewEquipmentByIdUseCase(IEquipmentRepository equipmentRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task<Equipment> ExecuteAsync(int equipmentId)
    {
        return await _equipmentRepository.GetByIdAsync(equipmentId);
    }
}