using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Appointments;
using FloorballTraining.UseCases.Appointments.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class AppointmentsController(
    IViewAppointmentsUseCase viewAppointmentsUseCase,
    IViewAppointmentByIdUseCase viewAppointmentByIdUseCase,
    IAddAppointmentUseCase addAppointmentUseCase,
    IEditAppointmentUseCase editAppointmentUseCase,
    IDeleteAppointmentUseCase deleteAppointmentUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await viewAppointmentsUseCase.ExecuteAsync(new AppointmentSpecificationParameters());
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewAppointmentByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AppointmentDto dto)
    {
        await addAppointmentUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] AppointmentDto dto, [FromQuery] bool updateWholeChain = false)
    {
        await editAppointmentUseCase.ExecuteAsync(dto, updateWholeChain);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int appointmentId)
    {
        await deleteAppointmentUseCase.ExecuteAsync(appointmentId);
        return NoContent();
    }
}
