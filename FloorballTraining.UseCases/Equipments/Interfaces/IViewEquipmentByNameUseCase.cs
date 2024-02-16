using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Equipments;

public interface IViewEquipmentByNameUseCase
{
    Task<IReadOnlyList<Equipment>> ExecuteAsync(string searchString = "");
}