using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IEquipmentRepository : IGenericRepository<Equipment>
{
    Task AddEquipmentAsync(Equipment equipment);
    Task UpdateEquipmentAsync(Equipment equipment);
    Task<IReadOnlyList<Equipment>> GetEquipmentsByNameAsync(string searchString = "");
    Task DeleteEquipmentAsync(Equipment equipment);
}