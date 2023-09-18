using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IEquipmentRepository
{
    Task AddEquipmentAsync(Equipment equipment);
    Task UpdateEquipmentAsync(Equipment equipment);
    Task<Equipment> GetEquipmentByIdAsync(int equipmentId);
    Task<IEnumerable<Equipment>> GetEquipmentsByNameAsync(string searchString = "");
    Task<Equipment> GetEquipmentByNameAsync(string searchString);

    Task<bool> ExistsEquipmentByNameAsync(string searchString);

    Task DeleteEquipmentAsync(Equipment equipment);


}