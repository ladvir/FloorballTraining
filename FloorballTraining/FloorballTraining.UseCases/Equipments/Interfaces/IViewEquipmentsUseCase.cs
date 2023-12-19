using FloorballTraining.CoreBusiness;

namespace FloorballTraining.UseCases.Equipments;

public interface IViewEquipmentsUseCase
{
    Task<IReadOnlyList<Equipment>> ExecuteAsync();
}