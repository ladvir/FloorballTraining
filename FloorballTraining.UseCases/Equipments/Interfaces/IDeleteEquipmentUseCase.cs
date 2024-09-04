namespace FloorballTraining.UseCases.Equipments.Interfaces;

public interface IDeleteEquipmentUseCase
{
    Task ExecuteAsync(int equipmentId);
}