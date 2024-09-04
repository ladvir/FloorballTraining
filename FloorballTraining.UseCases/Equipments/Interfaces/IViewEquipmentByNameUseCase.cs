using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Equipments.Interfaces;

public interface IViewEquipmentByNameUseCase
{
    Task<IReadOnlyList<Equipment>> ExecuteAsync(string searchString = "");
}