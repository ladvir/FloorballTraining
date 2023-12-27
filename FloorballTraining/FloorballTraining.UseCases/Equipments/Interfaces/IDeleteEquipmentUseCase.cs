namespace FloorballTraining.UseCases.Equipments;

public interface IDeleteEquipmentUseCase
{
    Task ExecuteAsync(int equipmentId);
}