using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Equipments;

public interface IViewEquipmentByIdUseCase
{
    Task<Equipment> ExecuteAsync(int equipmentId);
}