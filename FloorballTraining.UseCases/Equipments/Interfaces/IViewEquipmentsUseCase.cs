using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;

namespace FloorballTraining.UseCases.Equipments.Interfaces;

public interface IViewEquipmentsUseCase
{
    Task<Pagination<EquipmentDto>> ExecuteAsync(EquipmentSpecificationParameters parameters);
}