using System.Security.Claims;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.Services;
using FloorballTraining.UseCases.Appointments;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class AppointmentsController(
    IViewAppointmentsUseCase viewAppointmentsUseCase,
    IViewAppointmentByIdUseCase viewAppointmentByIdUseCase,
    IAddAppointmentUseCase addAppointmentUseCase,
    IEditAppointmentUseCase editAppointmentUseCase,
    IDeleteAppointmentUseCase deleteAppointmentUseCase,
    IAppointmentService appointmentService,
    UserManager<AppUser> userManager)
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

    [Authorize]
    [HttpGet("export")]
    public async Task<IActionResult> ExportWorkTime(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromQuery] string? userId = null)
    {
        // Determine target user
        var targetUserId = userId;
        if (!IsAdmin() || string.IsNullOrEmpty(targetUserId))
        {
            targetUserId = GetCurrentUserId();
        }

        var targetUser = targetUserId != null ? await userManager.FindByIdAsync(targetUserId) : null;
        var coachName = targetUser != null
            ? $"{targetUser.FirstName} {targetUser.LastName}".Trim()
            : "";

        // Get all appointments for the month
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddSeconds(-1);

        var result = await viewAppointmentsUseCase.ExecuteAsync(new AppointmentSpecificationParameters
        {
            Start = startDate,
            End = endDate,
            PageSize = 500
        });

        var allAppointments = result.Data?.ToList() ?? [];

        // Filter: team events for user's teams + personal events owned by user
        var userAppointments = allAppointments
            .Where(a =>
                (a.TeamId != null) || // team events
                (a.OwnerUserId != null && a.OwnerUserId == targetUserId)) // user's personal events
            .ToList();

        // Determine team name from the most common team
        var teamName = userAppointments
            .Where(a => a.TeamId != null)
            .GroupBy(a => a.TeamId)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault()
            ?.First()
            ?.LocationName ?? "";

        var exportData = new AppointmentsExportDto
        {
            TeamName = teamName,
            CoachName = coachName,
            Appointments = userAppointments,
            Preparation = 0
        };

        var bytes = await appointmentService.GenerateWorkTimeExcel(exportData);
        if (bytes == null) return NotFound("Žádné události pro export.");

        var safeCoachName = string.IsNullOrWhiteSpace(coachName) ? "export" : coachName.Replace(' ', '-');
        var fileName = $"vykaz-prace-{safeCoachName}-{year}-{month:D2}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
