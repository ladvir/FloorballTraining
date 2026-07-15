using System.Security.Claims;
using FloorballTraining.CoreBusiness;
using FloorballTraining.API.Errors;
using FloorballTraining.API.Helpers;
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
using FloorballTraining.API.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
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
    IAuditService auditService,
    INotificationService notificationService,
    IHubContext<NotificationHub> hubContext,
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
        {
            // Fall back to all club teams when no explicit team assignments exist so coaches
            // whose TeamMember.IsCoach records haven't been set up can still see club events.
            if (roleInfo.CoachTeamIds.Count > 0)
                return roleInfo.CoachTeamIds;
            if (roleInfo.ClubId.HasValue)
                return await context.Teams
                    .Where(t => t.ClubId == roleInfo.ClubId.Value)
                    .Select(t => t.Id)
                    .ToListAsync();
            return [];
        }

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

    private async Task PopulateAppointmentTests(IEnumerable<AppointmentDto> dtos)
    {
        var ids = dtos.Select(d => d.Id).Where(id => id > 0).Distinct().ToList();
        if (ids.Count == 0) return;

        var links = await context.AppointmentTestDefinitions
            .Where(atd => ids.Contains(atd.AppointmentId) && atd.TestDefinition != null)
            .Select(atd => new { atd.AppointmentId, atd.TestDefinitionId, Name = atd.TestDefinition!.Name })
            .ToListAsync();

        var byAppointment = links.GroupBy(l => l.AppointmentId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var dto in dtos)
        {
            if (!byAppointment.TryGetValue(dto.Id, out var testLinks)) continue;
            dto.TestDefinitionIds = testLinks.Select(l => l.TestDefinitionId).ToList();
            dto.Tests = testLinks
                .Select(l => new AppointmentTestRefDto { Id = l.TestDefinitionId, Name = l.Name })
                .OrderBy(t => t.Name)
                .ToList();
        }
    }

    private async Task PopulateOwnerUserNames(IEnumerable<AppointmentDto> dtos)
    {
        var userIds = dtos.Select(d => d.OwnerUserId).Where(id => id != null).Cast<string>().Distinct().ToList();
        var nameMap = await UserNameHelper.GetNameMapAsync(userManager, userIds);
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

            var myMemberId = await context.Members
                .Where(m => m.AppUserId == userId)
                .Select(m => (int?)m.Id)
                .FirstOrDefaultAsync();

            Dictionary<int, bool> assignedAppointmentCompletions = [];
            if (myMemberId.HasValue)
            {
                assignedAppointmentCompletions = await context.AppointmentMemberAssignments
                    .Where(a => a.MemberId == myMemberId.Value)
                    .ToDictionaryAsync(a => a.AppointmentId, a => a.IsCompleted);
            }

            var assignedIds = assignedAppointmentCompletions.Keys.ToHashSet();

            var filtered = result.Data
                .Where(a =>
                    (a.TeamId != null && accessibleTeamIds.Contains(a.TeamId.Value)) ||
                    (a.TeamId == null && (a.OwnerUserId == null || a.OwnerUserId == userId)) ||
                    assignedIds.Contains(a.Id))
                .ToList();

            foreach (var dto in filtered.Where(f => assignedIds.Contains(f.Id)))
            {
                dto.IsAssignedToMe = true;
                dto.MyAssignmentCompleted = assignedAppointmentCompletions[dto.Id];
            }

            result = new Pagination<AppointmentDto>(result.PageIndex, result.PageSize, filtered.Count, filtered);

            // Batch-load member assignments for all filtered appointments so the list
            // view can show "assigned to Novák, Procházka" without a second request.
            var filteredIds = filtered.Select(f => f.Id).ToList();
            if (filteredIds.Count > 0)
            {
                var allAssignments = await context.AppointmentMemberAssignments
                    .Where(a => filteredIds.Contains(a.AppointmentId))
                    .Include(a => a.Member)
                    .ToListAsync();

                var byAppointment = allAssignments
                    .GroupBy(a => a.AppointmentId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                foreach (var dto in filtered)
                {
                    if (!byAppointment.TryGetValue(dto.Id, out var asgns)) continue;
                    dto.MemberAssignments = asgns.Select(a => new AppointmentMemberAssignmentDto
                    {
                        Id = a.Id,
                        MemberId = a.MemberId,
                        MemberFirstName = a.Member?.FirstName,
                        MemberLastName = a.Member?.LastName,
                        IsCompleted = a.IsCompleted,
                        CompletedAt = a.CompletedAt,
                    }).ToList();
                }
            }
        }

        if (result.Data != null)
        {
            await PopulateOwnerUserNames(result.Data);
            await PopulateAppointmentTests(result.Data);
        }
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewAppointmentByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();

        var userId = GetCurrentUserId();

        // Check access to personal events
        if (result.TeamId == null && result.OwnerUserId != null && !IsAdmin() && result.OwnerUserId != userId)
            return NotFound();

        await PopulateOwnerUserNames(new[] { result });
        await PopulateAppointmentTests(new[] { result });
        await PopulateAssignments(result, userId);
        return Ok(result);
    }

    private async Task PopulateAssignments(AppointmentDto dto, string? userId)
    {
        var assignments = await context.AppointmentMemberAssignments
            .Where(a => a.AppointmentId == dto.Id)
            .Include(a => a.Member)
            .ToListAsync();

        dto.MemberAssignments = assignments.Select(a => new AppointmentMemberAssignmentDto
        {
            Id = a.Id,
            MemberId = a.MemberId,
            MemberFirstName = a.Member?.FirstName,
            MemberLastName = a.Member?.LastName,
            IsCompleted = a.IsCompleted,
            CompletedAt = a.CompletedAt
        }).ToList();

        if (userId != null)
        {
            var myMemberId = await context.Members
                .Where(m => m.AppUserId == userId)
                .Select(m => (int?)m.Id)
                .FirstOrDefaultAsync();

            if (myMemberId.HasValue)
            {
                var mine = dto.MemberAssignments.FirstOrDefault(a => a.MemberId == myMemberId.Value);
                if (mine != null)
                {
                    dto.IsAssignedToMe = true;
                    dto.MyAssignmentCompleted = mine.IsCompleted;
                }
            }
        }
    }

    private async Task SyncMemberAssignmentsAsync(int appointmentId, List<int> memberIds, string? appointmentLabel = null)
    {
        var existing = await context.AppointmentMemberAssignments
            .Where(a => a.AppointmentId == appointmentId)
            .ToListAsync();

        var existingIds = existing.Select(a => a.MemberId).ToHashSet();
        var newIds = memberIds.ToHashSet();

        var toAdd = newIds.Except(existingIds).Select(mid => new AppointmentMemberAssignment
        {
            AppointmentId = appointmentId,
            MemberId = mid
        }).ToList();

        var toRemove = existing.Where(a => !newIds.Contains(a.MemberId)).ToList();

        if (toAdd.Count > 0) context.AppointmentMemberAssignments.AddRange(toAdd);
        if (toRemove.Count > 0) context.AppointmentMemberAssignments.RemoveRange(toRemove);
        if (toAdd.Count > 0 || toRemove.Count > 0) await context.SaveChangesAsync();

        // Notify newly assigned members that have an app account
        if (toAdd.Count > 0)
        {
            var newMemberIds = toAdd.Select(a => a.MemberId).ToList();
            var appUserIds = await context.Members
                .Where(m => newMemberIds.Contains(m.Id) && m.AppUserId != null)
                .Select(m => m.AppUserId!)
                .ToListAsync();

            var label = string.IsNullOrEmpty(appointmentLabel) ? "Událost" : appointmentLabel;
            foreach (var uid in appUserIds)
            {
                await notificationService.CreateForUserAsync(
                    uid, "EventAssigned", "Přidělená událost",
                    $"Byl/a jsi přiřazen/a k události: {label}");
                // Push appointment.changed so the member's calendar and dashboard
                // re-fetch immediately without requiring a page refresh.
                await hubContext.Clients.User(uid).SendAsync("appointment.changed");
            }
        }
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AppointmentDto dto)
    {
        if (dto.TeamId == null || dto.TeamId == 0)
            dto.TeamId = null;

        // Location is a required FK — reject a missing/unknown place with 400 instead of a DbUpdateException
        if (dto.LocationId <= 0 || !await context.Places.AnyAsync(p => p.Id == dto.LocationId))
            return BadRequest(new { message = "Vyberte místo konání události." });

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
        if (dto.AssignedMemberIds.Count > 0)
            await SyncMemberAssignmentsAsync(dto.Id, dto.AssignedMemberIds, dto.Name);
        await auditService.LogAsync(AuditActions.AppointmentCreated, "Appointment", dto.Id.ToString(),
            details: new { name = dto.Name, start = dto.Start, teamId = dto.TeamId });
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

        // Location is a required FK — reject a missing/unknown place with 400 instead of a DbUpdateException
        if (dto.LocationId <= 0 || !await context.Places.AnyAsync(p => p.Id == dto.LocationId))
            return BadRequest(new { message = "Vyberte místo konání události." });

        dto.OwnerUserId = existing.OwnerUserId ?? userId;
        await editAppointmentUseCase.ExecuteAsync(dto, updateWholeChain);
        await SyncMemberAssignmentsAsync(dto.Id, dto.AssignedMemberIds, dto.Name);
        await auditService.LogAsync(AuditActions.AppointmentUpdated, "Appointment", dto.Id.ToString(),
            details: new { name = dto.Name, start = dto.Start, updateWholeChain });
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
        await auditService.LogAsync(AuditActions.AppointmentDeleted, "Appointment", appointmentId.ToString(),
            details: new { name = existing.Name, start = existing.Start, alsoFutureAppointments });
        return NoContent();
    }

    [HttpPut("{id:int}/assignments/complete")]
    public async Task<IActionResult> MarkAssignmentComplete(int id, [FromQuery] bool isCompleted = true)
    {
        var userId = GetCurrentUserId()!;
        var myMemberId = await context.Members
            .Where(m => m.AppUserId == userId)
            .Select(m => (int?)m.Id)
            .FirstOrDefaultAsync();

        if (myMemberId == null) return Forbid();

        var assignment = await context.AppointmentMemberAssignments
            .FirstOrDefaultAsync(a => a.AppointmentId == id && a.MemberId == myMemberId.Value);

        if (assignment == null) return NotFound();

        assignment.IsCompleted = isCompleted;
        assignment.CompletedAt = isCompleted ? DateTime.UtcNow : null;
        await context.SaveChangesAsync();

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
        // Null out the self-referencing FK first; the NO ACTION DB constraint (from EF's
        // ClientSetNull default) would otherwise reject the bulk DELETE when recurring
        // appointment chains exist. ExecuteDeleteAsync bypasses EF change-tracking so
        // ClientSetNull never runs without this explicit update.
        await context.Appointments
            .Where(a => a.ParentAppointmentId != null)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.ParentAppointmentId, (int?)null));

        var count = await context.Appointments.ExecuteDeleteAsync();
        if (count > 0)
            await auditService.LogAsync(AuditActions.AppointmentBulkDeleted, "Appointment", "bulk",
                details: new { deleted = count });
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
        if (month < 1 || month > 12)
            return BadRequest(new ApiResponse(400, "Neplatný měsíc. Povolené hodnoty jsou 1–12."));
        if (year < 2000 || year > 2100)
            return BadRequest(new ApiResponse(400, "Neplatný rok."));

        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddSeconds(-1);

        var result = await viewAppointmentsUseCase.ExecuteAsync(new AppointmentSpecificationParameters
        {
            Start = startDate,
            End = endDate,
            PageSize = 10000
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
            // Teams the target user coaches:
            //   • TeamMember rows explicitly marked IsCoach, AND
            //   • for Members carrying a club-level coach role (HasClubRoleCoach / HasClubRoleMainCoach),
            //     ANY TeamMember row of theirs counts — the team-add UI doesn't always backfill
            //     TeamMember.IsCoach when adding an existing coach to a team, so the column is unreliable.
            var memberRows = await context.Members
                .Where(m => m.AppUserId == targetUserId)
                .Select(m => new
                {
                    m.HasClubRoleCoach,
                    m.HasClubRoleMainCoach,
                    TeamMembers = m.TeamMembers
                        .Where(tm => tm.TeamId.HasValue)
                        .Select(tm => new { TeamId = tm.TeamId!.Value, tm.IsCoach })
                        .ToList(),
                })
                .ToListAsync();

            var coachTeamIds = memberRows
                .SelectMany(m => m.TeamMembers
                    .Where(tm => tm.IsCoach || m.HasClubRoleCoach || m.HasClubRoleMainCoach)
                    .Select(tm => tm.TeamId))
                .Distinct()
                .ToList();

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
                // If the Member carries a club-level coach role, count every team they're a TeamMember of
                // (the per-row IsCoach flag isn't reliably set by the team-add UI).
                // Otherwise fall back to TeamMember.IsCoach explicitly.
                TeamIds = g.SelectMany(m => m.TeamMembers
                        .Where(tm => (tm.IsCoach || m.HasClubRoleCoach || m.HasClubRoleMainCoach)
                            && tm.TeamId.HasValue
                            && clubTeamIds.Contains(tm.TeamId!.Value))
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
            or AppointmentType.Testing
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

    // ── Attendance endpoints ──────────────────────────────────────────────────

    [HttpGet("{id:int}/attendance")]
    public async Task<IActionResult> GetAttendance(int id)
    {
        var appointment = await context.Appointments
            .Where(a => a.Id == id)
            .Select(a => new { a.Id, a.TeamId, a.OwnerUserId })
            .FirstOrDefaultAsync();
        if (appointment == null) return NotFound();

        var records = await context.AppointmentAttendances
            .Where(a => a.AppointmentId == id)
            .Select(a => new AppointmentAttendanceDto
            {
                Id = a.Id,
                AppointmentId = a.AppointmentId,
                MemberId = a.MemberId,
                MemberFirstName = a.Member!.FirstName,
                MemberLastName = a.Member.LastName,
                Status = a.Status,
                Note = a.Note,
                RecordedAt = a.RecordedAt,
            })
            .OrderBy(a => a.MemberLastName).ThenBy(a => a.MemberFirstName)
            .ToListAsync();

        return Ok(records);
    }

    [HttpPut("{id:int}/attendance")]
    public async Task<IActionResult> UpsertAttendance(int id, [FromBody] List<AttendanceUpsertDto> records)
    {
        var existing = await viewAppointmentByIdUseCase.ExecuteAsync(id);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId()!;
        if (!await CanModifyAppointmentAsync(existing, userId)) return Forbid();

        var currentRecords = await context.AppointmentAttendances
            .Where(a => a.AppointmentId == id)
            .ToListAsync();

        foreach (var dto in records)
        {
            var current = currentRecords.FirstOrDefault(r => r.MemberId == dto.MemberId);
            if (current == null)
            {
                context.AppointmentAttendances.Add(new AppointmentAttendance
                {
                    AppointmentId = id,
                    MemberId = dto.MemberId,
                    Status = dto.Status,
                    Note = dto.Note,
                    RecordedByUserId = userId,
                    RecordedAt = DateTime.UtcNow,
                });
            }
            else
            {
                current.Status = dto.Status;
                current.Note = dto.Note;
                current.RecordedByUserId = userId;
                current.RecordedAt = DateTime.UtcNow;
            }
        }

        // Remove records for members no longer in the list
        var incomingIds = records.Select(r => r.MemberId).ToHashSet();
        var toRemove = currentRecords.Where(r => !incomingIds.Contains(r.MemberId)).ToList();
        context.AppointmentAttendances.RemoveRange(toRemove);

        await context.SaveChangesAsync();
        await auditService.LogAsync(AuditActions.AppointmentUpdated, "AppointmentAttendance", id.ToString(),
            details: new { count = records.Count });
        return NoContent();
    }

    // ── RSVP endpoints ─────────────────────────────────────────────────────────

    [HttpGet("{id:int}/rsvp")]
    public async Task<IActionResult> GetRsvp(int id)
    {
        var apt = await viewAppointmentByIdUseCase.ExecuteAsync(id);
        if (apt == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        var isCoachOrAbove = roleInfo.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin" or "Admin";

        // Find my linked member record
        var myMember = await context.Members
            .Where(m => m.AppUserId == userId)
            .Select(m => new { m.Id, m.ClubId })
            .FirstOrDefaultAsync();

        var allRsvps = await context.EventRsvps
            .Where(r => r.AppointmentId == id)
            .Select(r => new EventRsvpDto
            {
                AppointmentId = r.AppointmentId,
                MemberId = r.MemberId,
                MemberFirstName = r.Member!.FirstName,
                MemberLastName = r.Member.LastName,
                Status = r.Status,
                ConfirmedAt = r.ConfirmedAt,
                Note = r.Note,
            })
            .ToListAsync();

        var myStatus = myMember != null
            ? allRsvps.FirstOrDefault(r => r.MemberId == myMember.Id)?.Status
            : null;

        return Ok(new AppointmentRsvpSummaryDto
        {
            MyStatus = myStatus,
            All = isCoachOrAbove ? allRsvps : [],
            CountYes = allRsvps.Count(r => r.Status == 1),
            CountNo = allRsvps.Count(r => r.Status == 2),
            CountMaybe = allRsvps.Count(r => r.Status == 3),
            CountPending = allRsvps.Count(r => r.Status == 0),
        });
    }

    [HttpPut("{id:int}/rsvp")]
    public async Task<IActionResult> UpsertRsvp(int id, [FromBody] EventRsvpUpdateDto dto)
    {
        if (dto.Status is < 0 or > 3) return BadRequest("Neplatný stav.");

        var apt = await viewAppointmentByIdUseCase.ExecuteAsync(id);
        if (apt == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var myMember = await context.Members
            .Where(m => m.AppUserId == userId)
            .Select(m => new { m.Id })
            .FirstOrDefaultAsync();

        if (myMember == null)
            return BadRequest("Váš účet není propojen s žádným členem klubu.");

        var existing = await context.EventRsvps
            .FirstOrDefaultAsync(r => r.AppointmentId == id && r.MemberId == myMember.Id);

        if (existing == null)
        {
            context.EventRsvps.Add(new EventRsvp
            {
                AppointmentId = id,
                MemberId = myMember.Id,
                Status = dto.Status,
                ConfirmedAt = DateTime.UtcNow,
                Note = dto.Note,
            });
        }
        else
        {
            existing.Status = dto.Status;
            existing.ConfirmedAt = DateTime.UtcNow;
            existing.Note = dto.Note;
        }

        await context.SaveChangesAsync();
        return NoContent();
    }
}
