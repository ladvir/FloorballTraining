using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Equipments;

public interface IViewEquipmentByIdUseCase
{
    Task<EquipmentDto?> ExecuteAsync(int equipmentId);
}