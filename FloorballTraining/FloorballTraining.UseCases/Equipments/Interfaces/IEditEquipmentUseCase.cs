using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Equipments;

public interface IEditEquipmentUseCase
{
    Task ExecuteAsync(Equipment equipment);
}