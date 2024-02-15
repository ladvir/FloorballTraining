using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Equipments;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;


public class EquipmentsController : BaseApiController
{

    private readonly IViewEquipmentByIdUseCase _viewEquipmentByIdUseCase;
    private readonly IViewEquipmentsUseCase _viewEquipmentsUseCase;
    private readonly IViewEquipmentsAllUseCase _viewEquipmentsAllUseCase;

    public EquipmentsController(

        IViewEquipmentByIdUseCase viewEquipmentByIdUseCase,
        IViewEquipmentsUseCase viewEquipmentsUseCase,
        IViewEquipmentsAllUseCase viewEquipmentsAllUseCase)
    {

        _viewEquipmentByIdUseCase = viewEquipmentByIdUseCase;
        _viewEquipmentsUseCase = viewEquipmentsUseCase;
        _viewEquipmentsAllUseCase = viewEquipmentsAllUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<Pagination<EquipmentDto>>> Index(

        [FromQuery] EquipmentSpecificationParameters parameters)
    {
        var equipments = await _viewEquipmentsUseCase.ExecuteAsync(parameters);

        if (equipments.Data != null && !equipments.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<EquipmentDto>>(equipments);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<EquipmentDto>>> GetEquipmentsAll()
    {
        var equipments = await _viewEquipmentsAllUseCase.ExecuteAsync();

        if (!equipments.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<IReadOnlyList<EquipmentDto>>(equipments);
    }

    [HttpGet("{equipmentId}")]
    public async Task<EquipmentDto?> Get(int equipmentId)
    {
        return await _viewEquipmentByIdUseCase.ExecuteAsync(equipmentId);
    }
}