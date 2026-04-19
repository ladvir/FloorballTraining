using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.API.Controllers.Requests;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.Services;
using FloorballTraining.UseCases.Appointments;
using FloorballTraining.UseCases.Appointments.Interfaces;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class AppointmentsController(
    IViewAppointmentsUseCase viewAppointmentsUseCase,
    IViewAppointmentByIdUseCase viewAppointmentByIdUseCase,
    IAddAppointmentUseCase addAppointmentUseCase,
    IEditAppointmentUseCase editAppointmentUseCase,
    IDeleteAppointmentUseCase deleteAppointmentUseCase,
    IAppointmentService appointmentService,
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService,
    FloorballTrainingContext context)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsAdmin() => User.IsInRole("Admin");

    private async Task<List<int>> GetAccessibleTeamIdsAsync()
    {
        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        if (roleInfo.EffectiveRole == "Admin")
            return await context.Teams.Select(t => t.Id).ToListAsync();

        if (roleInfo.EffectiveRole == "HeadCoach" && roleInfo.ClubId.HasValue)
            return await context.Teams
                .Where(t => t.ClubId == roleInfo.ClubId.Value)
                .Select(t => t.Id)
                .ToListAsync();

        if (roleInfo.EffectiveRole == "Coach")
            return roleInfo.CoachTeamIds;

        // Player / regular user: only teams where they are listed as a team member
        if (roleInfo.ClubId.HasValue)
        {
            var memberId = await context.Members
                .Where(m => m.AppUserId == userId && m.ClubId == roleInfo.ClubId.Value)
                .Select(m => (int?)m.Id)
                .FirstOrDefaultAsync();
            if (memberId == null) return [];

            return await context.TeamMembers
                .Where(tm => tm.MemberId == memberId.Value && tm.TeamId.HasValue)
                .Select(tm => tm.TeamId!.Value)
                .Distinct()
                .ToListAsync();
        }

        return [];
    }

    private async Task PopulateOwnerUserNames(IEnumerable<AppointmentDto> dtos)
    {
        var userIds = dtos.Select(d => d.OwnerUserId).Where(id => id != null).Distinct().ToList();
        var nameMap = new Dictionary<string, string>();
        foreach (var uid in userIds)
        {
            var u = await userManager.FindByIdAsync(uid!);
            if (u != null) nameMap[uid!] = $"{u.FirstName} {u.LastName}".Trim();
        }
        foreach (var dto in dtos)
        {
            if (dto.OwnerUserId != null && nameMap.TryGetValue(dto.OwnerUserId, out var name))
                dto.OwnerUserName = name;
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AppointmentSpecificationParameters parameters)
    {
        var result = await viewAppointmentsUseCase.ExecuteAsync(parameters);

        var userId = GetCurrentUserId();

        if (result.Data != null && userId != null)
        {
            var accessibleTeamIds = await GetAccessibleTeamIdsAsync();

            var filtered = result.Data
                .Where(a =>
                    (a.TeamId != null && accessibleTeamIds.Contains(a.TeamId.Value)) ||
                    (a.TeamId == null && (a.OwnerUserId == null || a.OwnerUserId == userId)))
                .ToList();
            result = new Pagination<AppointmentDto>(result.PageIndex, result.PageSize, filtered.Count, filtered);
        }

        if (result.Data != null) await PopulateOwnerUserNames(result.Data);
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

        await PopulateOwnerUserNames(new[] { result });
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AppointmentDto dto)
    {
        if (dto.TeamId == null || dto.TeamId == 0)
            dto.TeamId = null;

        var userId = GetCurrentUserId()!;

        // Team events require Coach+ and team access
        if (dto.TeamId != null)
        {
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
            if (roleInfo.EffectiveRole == "User") return Forbid();

            if (roleInfo.EffectiveRole == "Coach" && !roleInfo.CoachTeamIds.Contains(dto.TeamId.Value))
                return Forbid();
        }

        dto.OwnerUserId = userId;
        await addAppointmentUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] AppointmentDto dto, [FromQuery] bool updateWholeChain = false)
    {
        var existing = await viewAppointmentByIdUseCase.ExecuteAsync(dto.Id);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        if (existing.TeamId != null)
        {
            // Team event: require Coach+ with access to this team
            if (roleInfo.EffectiveRole == "User") return Forbid();
            if (roleInfo.EffectiveRole == "Coach" && !roleInfo.CoachTeamIds.Contains(existing.TeamId.Value))
                return Forbid();
        }
        else
        {
            // Personal event: only author or Admin
            if (roleInfo.EffectiveRole != "Admin" && existing.OwnerUserId != null && existing.OwnerUserId != userId)
                return Forbid();
        }

        if (dto.TeamId == null || dto.TeamId == 0)
            dto.TeamId = null;

        dto.OwnerUserId = existing.OwnerUserId ?? userId;
        await editAppointmentUseCase.ExecuteAsync(dto, updateWholeChain);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int appointmentId, [FromQuery] bool alsoFutureAppointments = false)
    {
        var existing = await viewAppointmentByIdUseCase.ExecuteAsync(appointmentId);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        if (existing.TeamId != null)
        {
            // Team event: require Coach+ with access to this team
            if (roleInfo.EffectiveRole == "User") return Forbid();
            if (roleInfo.EffectiveRole == "Coach" && !roleInfo.CoachTeamIds.Contains(existing.TeamId.Value))
                return Forbid();
        }
        else
        {
            // Personal event: only author or Admin
            if (roleInfo.EffectiveRole != "Admin" && existing.OwnerUserId != null && existing.OwnerUserId != userId)
                return Forbid();
        }

        await deleteAppointmentUseCase.ExecuteAsync(appointmentId, alsoFutureAppointments);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("import-ical")]
    public async Task<IActionResult> ImportICal(
        [FromBody] ICalImportRequest request,
        [FromServices] IICalImportService iCalImportService)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
            return BadRequest(new { message = "URL kalendáře je povinná." });
        if (request.TeamId <= 0)
            return BadRequest(new { message = "Vyberte tým." });

        var result = await iCalImportService.ImportFromUrlAsync(request.Url, request.TeamId, GetCurrentUserId()!);

        if (result.Errors.Count > 0 && result.Imported == 0 && result.Updated == 0)
            return BadRequest(new { message = string.Join("; ", result.Errors) });

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("all")]
    public async Task<IActionResult> DeleteAll()
    {
        var all = await viewAppointmentsUseCase.ExecuteAsync(new AppointmentSpecificationParameters { PageSize = 10000 });
        var count = 0;
        foreach (var apt in all.Data ?? [])
        {
            await deleteAppointmentUseCase.ExecuteAsync(apt.Id, false);
            count++;
        }
        return Ok(new { deleted = count });
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
