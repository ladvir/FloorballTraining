using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Equipments.Interfaces;

public interface IViewEquipmentsAllUseCase
{
    Task<IReadOnlyList<EquipmentDto>> ExecuteAsync();
}