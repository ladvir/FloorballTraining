using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Equipments;

public interface IDeleteEquipmentUseCase
{
    Task ExecuteAsync(Equipment equipment);
}