using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Equipments.Interfaces;

public interface IViewEquipmentByIdUseCase
{
    Task<EquipmentDto?> ExecuteAsync(int equipmentId);
}