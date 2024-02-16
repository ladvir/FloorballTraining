using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Equipments;

public interface IAddEquipmentUseCase
{
    Task ExecuteAsync(EquipmentDto equipment);
}