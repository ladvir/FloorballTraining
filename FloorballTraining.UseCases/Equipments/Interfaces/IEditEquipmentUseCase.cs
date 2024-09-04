using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Equipments.Interfaces;

public interface IEditEquipmentUseCase
{
    Task ExecuteAsync(EquipmentDto equipment);
}