using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Equipments.Interfaces;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;


public class EquipmentsController(
    IViewEquipmentByIdUseCase viewEquipmentByIdUseCase,
    IViewEquipmentsUseCase viewEquipmentsUseCase,
    IViewEquipmentsAllUseCase viewEquipmentsAllUseCase,
    IAddEquipmentUseCase addEquipmentUseCase,
    IEditEquipmentUseCase editEquipmentUseCase,
    IDeleteEquipmentUseCase deleteEquipmentUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<Pagination<EquipmentDto>>> Index(

        [FromQuery] EquipmentSpecificationParameters parameters)
    {
        var equipments = await viewEquipmentsUseCase.ExecuteAsync(parameters);

        if (equipments.Data != null && !equipments.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<EquipmentDto>>(equipments);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<EquipmentDto>>> GetEquipmentsAll()
    {
        var equipments = await viewEquipmentsAllUseCase.ExecuteAsync();

        if (!equipments.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<IReadOnlyList<EquipmentDto>>(equipments);
    }

    [HttpGet("{equipmentId}")]
    public async Task<EquipmentDto?> Get(int equipmentId)
    {
        return await viewEquipmentByIdUseCase.ExecuteAsync(equipmentId);
    }

    [HttpPost]
    public async Task<ActionResult> Add([FromBody] EquipmentDto dto)
    {
        await addEquipmentUseCase.ExecuteAsync(dto);
        return Ok(dto);
    }

    [HttpPut("{equipmentId}")]
    public async Task<ActionResult> Edit(int equipmentId, [FromBody] EquipmentDto dto)
    {
        dto.Id = equipmentId;
        await editEquipmentUseCase.ExecuteAsync(dto);
        return Ok();
    }

    [HttpDelete("{equipmentId}")]
    public async Task<ActionResult> Delete(int equipmentId)
    {
        await deleteEquipmentUseCase.ExecuteAsync(equipmentId);
        return NoContent();
    }
}