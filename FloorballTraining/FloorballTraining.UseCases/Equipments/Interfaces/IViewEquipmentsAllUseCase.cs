using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Equipments;

public interface IViewEquipmentsAllUseCase
{
    Task<IReadOnlyList<EquipmentDto>> ExecuteAsync();
}