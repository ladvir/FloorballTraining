using System.Security.Claims;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Appointments;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Helpers;
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
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsAdmin() => User.IsInRole("Admin");

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AppointmentSpecificationParameters parameters)
    {
        var result = await viewAppointmentsUseCase.ExecuteAsync(parameters);

        // Filter personal events: only show user's own or if admin
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();

        if (result.Data != null && !isAdmin && userId != null)
        {
            var filtered = result.Data
                .Where(a => a.TeamId != null || a.OwnerUserId == null || a.OwnerUserId == userId)
                .ToList();
            result = new Pagination<AppointmentDto>(result.PageIndex, result.PageSize, filtered.Count, filtered);
        }

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewAppointmentByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();

        // Check access to personal events
        if (result.TeamId == null && result.OwnerUserId != null && !IsAdmin() && result.OwnerUserId != GetCurrentUserId())
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AppointmentDto dto)
    {
        // Set owner for personal events (no team)
        if (dto.TeamId == null || dto.TeamId == 0)
        {
            dto.TeamId = null;
            dto.OwnerUserId = GetCurrentUserId();
        }

        await addAppointmentUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] AppointmentDto dto, [FromQuery] bool updateWholeChain = false)
    {
        // Preserve owner for personal events
        if (dto.TeamId == null || dto.TeamId == 0)
        {
            dto.TeamId = null;
            dto.OwnerUserId ??= GetCurrentUserId();
        }

        await editAppointmentUseCase.ExecuteAsync(dto, updateWholeChain);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int appointmentId, [FromQuery] bool alsoFutureAppointments = false)
    {
        await deleteAppointmentUseCase.ExecuteAsync(appointmentId, alsoFutureAppointments);
        return NoContent();
    }
}
