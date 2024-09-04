using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Equipments.Interfaces;

public interface IAddEquipmentUseCase
{
    Task ExecuteAsync(EquipmentDto equipment);
}