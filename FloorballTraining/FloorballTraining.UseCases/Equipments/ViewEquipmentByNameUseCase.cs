using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.UseCases.Equipments;

public class ViewEquipmentByNameUseCase : IViewEquipmentByNameUseCase
{
    private readonly IEquipmentRepository _equipmentRepository;

    public ViewEquipmentByNameUseCase(IEquipmentRepository equipmentRepository)
    {
        _equipmentRepository = equipmentRepository;
    }


    public async Task<IReadOnlyList<Equipment>> ExecuteAsync(string searchString = "")
    {
        return await _equipmentRepository.GetEquipmentsByNameAsync(searchString);
    }
}


public class ViewEquipmentsUseCase : IViewEquipmentsUseCase
{
    private readonly IEquipmentRepository _equipmentRepository;

    public ViewEquipmentsUseCase(IEquipmentRepository equipmentRepository)
    {
        _equipmentRepository = equipmentRepository;
    }


    public async Task<IReadOnlyList<Equipment>> ExecuteAsync()
    {
        return await _equipmentRepository.GetAllAsync();
    }
}