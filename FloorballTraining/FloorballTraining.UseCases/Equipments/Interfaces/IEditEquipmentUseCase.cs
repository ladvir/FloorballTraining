using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Equipments;

public interface IEditEquipmentUseCase
{
    Task ExecuteAsync(EquipmentDto equipment);
}