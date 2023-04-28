using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Equipments;

public interface IAddEquipmentUseCase
{
    Task ExecuteAsync(Equipment equipment);
}