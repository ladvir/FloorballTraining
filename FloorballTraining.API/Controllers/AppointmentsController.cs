using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
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

    private async Task<bool> CanModifyAppointmentAsync(AppointmentDto existing, string userId)
    {
        if (IsAdmin()) return true;

        // Owner always allowed to touch their own event
        if (existing.OwnerUserId != null && existing.OwnerUserId == userId) return true;

        var myRoles = await clubRoleService.GetAllUserClubRolesAsync(userId);

        if (existing.TeamId != null)
        {
            var teamClubId = await context.Teams
                .Where(t => t.Id == existing.TeamId.Value)
                .Select(t => (int?)t.ClubId)
                .FirstOrDefaultAsync();
            if (teamClubId == null) return false;

            var roleInClub = myRoles.FirstOrDefault(r => r.ClubId == teamClubId.Value);
            if (roleInClub == null) return false;

            if (roleInClub.EffectiveRole is "ClubAdmin" or "HeadCoach") return true;
            if (roleInClub.EffectiveRole == "Coach" && roleInClub.CoachTeamIds.Contains(existing.TeamId.Value))
                return true;
            return false;
        }

        // Personal event: only author or Admin (handled above)
        return false;
    }

    private async Task<List<int>> GetAccessibleTeamIdsAsync()
    {
        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        if (roleInfo.EffectiveRole == "Admin")
            return await context.Teams.Select(t => t.Id).ToListAsync();

        if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach" && roleInfo.ClubId.HasValue)
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
        if (!await CanModifyAppointmentAsync(existing, userId)) return Forbid();

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
        if (!await CanModifyAppointmentAsync(existing, userId)) return Forbid();

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
        [FromQuery] string? userId = null,
        [FromQuery] string? scope = "single",
        [FromQuery] string? mode = "workbook",
        [FromQuery] int? clubId = null,
        [FromQuery] string? coverage = "own")
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddSeconds(-1);

        var result = await viewAppointmentsUseCase.ExecuteAsync(new AppointmentSpecificationParameters
        {
            Start = startDate,
            End = endDate,
            PageSize = 500
        });
        var allAppointments = result.Data?.ToList() ?? [];

        if (string.Equals(scope, "bulk", StringComparison.OrdinalIgnoreCase))
        {
            return await ExportBulkAsync(allAppointments, year, month, clubId, mode);
        }

        // ─── Single coach (existing behavior) ────────────────────────────
        var targetUserId = userId;
        if (!IsAdmin() || string.IsNullOrEmpty(targetUserId))
        {
            targetUserId = GetCurrentUserId();
        }

        var targetUser = targetUserId != null ? await userManager.FindByIdAsync(targetUserId) : null;
        var coachName = targetUser != null
            ? $"{targetUser.FirstName} {targetUser.LastName}".Trim()
            : "";

        // Admin-only "vše" mode: skip coach/owner filter — include every event in the month.
        var includeAll = IsAdmin() && string.Equals(coverage, "all", StringComparison.OrdinalIgnoreCase);

        List<AppointmentDto> userAppointments;
        double preparationHours;

        if (includeAll)
        {
            userAppointments = allAppointments
                .Where(a => a.AppointmentType != AppointmentType.Preparation)
                .ToList();

            preparationHours = allAppointments
                .Where(a => a.AppointmentType == AppointmentType.Preparation)
                .Sum(a => (a.End - a.Start).TotalHours);
        }
        else
        {
            // Teams where target user is a coach (TeamMember.IsCoach via their Member record)
            var coachTeamIds = await context.Members
                .Where(m => m.AppUserId == targetUserId)
                .SelectMany(m => m.TeamMembers)
                .Where(tm => tm.IsCoach && tm.TeamId.HasValue)
                .Select(tm => tm.TeamId!.Value)
                .Distinct()
                .ToListAsync();

            // "Jen moje": include
            //   • events on teams where target user is TeamMember.IsCoach
            //   • any event (team or personal) the target user authored, if its type counts for the report
            // This covers Admins / HeadCoaches who create team events (e.g. matches) without a
            // TeamMember.IsCoach link on their Member record.
            userAppointments = allAppointments
                .Where(a =>
                    (a.TeamId != null && coachTeamIds.Contains(a.TeamId.Value)) ||
                    (a.OwnerUserId == targetUserId && IsAllowedPersonalEventType(a.AppointmentType)))
                .ToList();

            preparationHours = allAppointments
                .Where(a => a.AppointmentType == AppointmentType.Preparation && a.OwnerUserId == targetUserId)
                .Sum(a => (a.End - a.Start).TotalHours);
        }

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
            Preparation = preparationHours,
        };

        var bytes = await appointmentService.GenerateWorkTimeExcel(exportData);
        if (bytes == null) return NotFound("Žádné události pro export.");

        var safeCoachName = string.IsNullOrWhiteSpace(coachName) ? "export" : coachName.Replace(' ', '-');
        var fileName = $"vykaz-prace-{safeCoachName}-{year}-{month:D2}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private async Task<IActionResult> ExportBulkAsync(
        List<AppointmentDto> allAppointments,
        int year,
        int month,
        int? requestedClubId,
        string? mode)
    {
        var callerId = GetCurrentUserId();
        if (callerId == null) return Unauthorized();

        var callerRoleInfo = await clubRoleService.GetUserClubRoleAsync(callerId);
        var isAdmin = callerRoleInfo.EffectiveRole == "Admin";
        var isClubAdmin = callerRoleInfo.EffectiveRole == "ClubAdmin";
        var isHeadCoach = callerRoleInfo.EffectiveRole == "HeadCoach";
        if (!isAdmin && !isClubAdmin && !isHeadCoach) return Forbid();

        // Resolve target club: admin may request any club, others get their active club
        var targetClubId = isAdmin
            ? (requestedClubId ?? callerRoleInfo.ClubId)
            : callerRoleInfo.ClubId;
        if (targetClubId == null) return BadRequest("Není určen klub pro hromadný export.");

        // If non-admin asked for a different club, deny
        if (!isAdmin && requestedClubId.HasValue && requestedClubId.Value != callerRoleInfo.ClubId)
            return Forbid();

        var club = await context.Clubs
            .Where(c => c.Id == targetClubId.Value)
            .Select(c => new { c.Id, c.Name })
            .FirstOrDefaultAsync();
        if (club == null) return NotFound("Klub neexistuje.");

        // Teams in this club (used to scope TeamMember.IsCoach filtering)
        var clubTeamIds = await context.Teams
            .Where(t => t.ClubId == targetClubId.Value)
            .Select(t => t.Id)
            .ToListAsync();

        // A member is an active coach in this club if all of the following hold:
        //   • Member.IsActive (not deactivated), AND
        //   • their Member row carries HasClubRoleCoach / HasClubRoleMainCoach, OR
        //     they are marked IsCoach on any TeamMember row for a team in this club.
        // We DO NOT require a linked AppUser — members without an account still get their own worksheet.
        var coachMembers = await context.Members
            .Include(m => m.TeamMembers)
            .Where(m => m.ClubId == targetClubId.Value
                && m.IsActive
                && (m.HasClubRoleCoach
                    || m.HasClubRoleMainCoach
                    || m.TeamMembers.Any(tm => tm.IsCoach
                        && tm.TeamId.HasValue
                        && clubTeamIds.Contains(tm.TeamId.Value))))
            .ToListAsync();
        if (coachMembers.Count == 0) return NotFound("V klubu nejsou evidováni žádní aktivní trenéři.");

        // Group by AppUserId when present (dedupe across rare duplicate-Member rows for the same user);
        // members without AppUserId stay separate, keyed by Member.Id.
        var coachGroups = coachMembers
            .GroupBy(m => !string.IsNullOrEmpty(m.AppUserId) ? $"user:{m.AppUserId}" : $"member:{m.Id}")
            .Select(g => new
            {
                AppUserId = g.First().AppUserId,
                FirstMember = g.First(),
                TeamIds = g.SelectMany(m => m.TeamMembers
                        .Where(tm => tm.IsCoach && tm.TeamId.HasValue && clubTeamIds.Contains(tm.TeamId!.Value))
                        .Select(tm => tm.TeamId!.Value))
                    .Distinct()
                    .ToList(),
            })
            .ToList();

        var userIds = coachGroups
            .Where(c => !string.IsNullOrEmpty(c.AppUserId))
            .Select(c => c.AppUserId!)
            .ToList();
        var appUsers = userIds.Count == 0
            ? new Dictionary<string, AppUser>()
            : await userManager.Users
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

        // Display name: prefer linked AppUser; fall back to Member's own name.
        string CoachDisplayName(string? appUserId, CoreBusiness.Member fallback)
        {
            if (!string.IsNullOrEmpty(appUserId) && appUsers.TryGetValue(appUserId, out var u))
                return $"{u.FirstName} {u.LastName}".Trim();
            return $"{fallback.FirstName} {fallback.LastName}".Trim();
        }

        // Build per-coach export data. Every coach in the club gets an entry, even with zero events.
        var perCoachData = coachGroups
            .Select(coach => new
            {
                Coach = coach,
                DisplayName = CoachDisplayName(coach.AppUserId, coach.FirstMember),
                Appointments = allAppointments
                    .Where(a =>
                        (a.TeamId != null && coach.TeamIds.Contains(a.TeamId.Value)) ||
                        (a.TeamId == null
                            && !string.IsNullOrEmpty(coach.AppUserId)
                            && a.OwnerUserId == coach.AppUserId
                            && IsAllowedPersonalEventType(a.AppointmentType)))
                    .ToList(),
                PreparationHours = string.IsNullOrEmpty(coach.AppUserId)
                    ? 0
                    : allAppointments
                        .Where(a => a.AppointmentType == AppointmentType.Preparation
                            && a.OwnerUserId == coach.AppUserId)
                        .Sum(a => (a.End - a.Start).TotalHours),
            })
            .OrderBy(c => c.Coach.FirstMember.LastName)
            .ThenBy(c => c.Coach.FirstMember.FirstName)
            .Select(c => new AppointmentsExportDto
            {
                TeamName = c.Appointments
                    .Where(a => a.TeamId != null)
                    .GroupBy(a => a.TeamId)
                    .OrderByDescending(g => g.Count())
                    .FirstOrDefault()
                    ?.First()
                    ?.LocationName ?? "",
                CoachName = c.DisplayName,
                Appointments = c.Appointments,
                Preparation = c.PreparationHours,
            })
            .ToList();

        if (perCoachData.Count == 0) return NotFound("V klubu nejsou evidováni žádní trenéři.");

        var clubNameSafe = SanitizeFileNamePart(club.Name);

        if (string.Equals(mode, "files", StringComparison.OrdinalIgnoreCase))
        {
            // ZIP of one xlsx per coach — every coach gets a file, even with zero events.
            using var memory = new MemoryStream();
            using (var archive = new System.IO.Compression.ZipArchive(memory, System.IO.Compression.ZipArchiveMode.Create, true))
            {
                foreach (var data in perCoachData)
                {
                    var bytes = await appointmentService.GenerateSingleCoachWorkbook(data, year, month);
                    var coachSafe = SanitizeFileNamePart(data.CoachName ?? "trenér");
                    var entryName = $"Výkaz práce - {coachSafe} - {month:D2}-{year}.xlsx";
                    var entry = archive.CreateEntry(entryName, System.IO.Compression.CompressionLevel.Fastest);
                    using var entryStream = entry.Open();
                    await entryStream.WriteAsync(bytes);
                }
            }
            var zipBytes = memory.ToArray();
            var zipName = $"Výkaz práce {clubNameSafe} {month:D2} {year}.zip";
            return File(zipBytes, "application/zip", zipName);
        }

        // Default: single workbook with one sheet per coach
        var workbookBytes = await appointmentService.GenerateBulkWorkTimeExcel(perCoachData, year, month);
        if (workbookBytes == null) return NotFound("V klubu nejsou evidováni žádní trenéři.");
        var fileName = $"Výkaz práce {clubNameSafe} {month:D2} {year}.xlsx";
        return File(workbookBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    // Personal (owner-only) events count in the work report only for these types.
    // Mapping to the Excel template's render slots:
    //   Trénink         → Training          → daily row
    //   Zápas           → Match             → daily row (fixed work time)
    //   Pořádání akce   → EventOrganization → "pořadatel" columns + Pořádání summary
    //   Propagace       → Promotion         → "pořadatel" columns + Pořádání summary
    //   Příprava        → Camp              → data carried through (no dedicated render slot)
    private static bool IsAllowedPersonalEventType(AppointmentType type) =>
        type is AppointmentType.Training
            or AppointmentType.Match
            or AppointmentType.Promotion
            or AppointmentType.EventOrganization
            or AppointmentType.Camp;

    private static string SanitizeFileNamePart(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "export";
        // Strip filesystem-invalid chars but keep Unicode letters (diacritics).
        var invalid = System.IO.Path.GetInvalidFileNameChars();
        var cleaned = new string(value.Select(c => invalid.Contains(c) ? '-' : c).ToArray()).Trim();
        return string.IsNullOrEmpty(cleaned) ? "export" : cleaned;
    }
}
