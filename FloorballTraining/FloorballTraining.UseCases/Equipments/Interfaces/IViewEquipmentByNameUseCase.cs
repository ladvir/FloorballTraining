using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Equipments;

public interface IViewEquipmentByNameUseCase
{
    Task<IEnumerable<Equipment>> ExecuteAsync(string searchString = "");
}