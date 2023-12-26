using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.PluginInterfaces;

public interface IEquipmentRepository : IGenericRepository<Equipment>
{
    Task AddEquipmentAsync(Equipment equipment);
    Task UpdateEquipmentAsync(Equipment equipment);
    Task DeleteEquipmentAsync(Equipment equipment);
}