using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.Equipments;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class EquipmentsController : BaseApiController
{
    private readonly IViewEquipmentByNameUseCase _viewEquipmentByNameUseCase;
    private readonly IViewEquipmentByIdUseCase _viewEquipmentByIdUseCase;
    private readonly IViewEquipmentsUseCase _viewEquipmentsUseCase;

    public EquipmentsController(
        IViewEquipmentByNameUseCase viewEquipmentByNameUseCase,
        IViewEquipmentByIdUseCase viewEquipmentByIdUseCase,
        IViewEquipmentsUseCase viewEquipmentsUseCase)
    {
        _viewEquipmentByNameUseCase = viewEquipmentByNameUseCase;
        _viewEquipmentByIdUseCase = viewEquipmentByIdUseCase;
        _viewEquipmentsUseCase = viewEquipmentsUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Equipment>>> Index()
    {
        var equipments = await _viewEquipmentsUseCase.ExecuteAsync();

        return new ActionResult<IReadOnlyList<Equipment>>(equipments);
    }

    [HttpGet("{equipmentId}")]
    public async Task<Equipment> Get(int equipmentId)
    {
        return await _viewEquipmentByIdUseCase.ExecuteAsync(equipmentId);


    }

    [HttpGet("name/{equipmentName}")]
    public async Task<ActionResult<IReadOnlyList<Equipment>>> Get(string equipmentName)
    {
        var equipments = await _viewEquipmentByNameUseCase.ExecuteAsync(equipmentName);

        return new ActionResult<IReadOnlyList<Equipment>>(equipments);
    }



}