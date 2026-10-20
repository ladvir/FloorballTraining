using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class LineupsController(
    FloorballTrainingContext context,
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService) : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private sealed record AccessScope(bool IsAdmin, bool CanEdit, int? ClubId, List<int> CoachTeamIds);

    private async Task<AccessScope> GetScopeAsync()
    {
        var userId = GetCurrentUserId()!;
        if (User.IsInRole("Admin"))
            return new AccessScope(true, true, null, []);

        var info = await clubRoleService.GetUserClubRoleAsync(userId);
        var canEdit = info.EffectiveRole is "ClubAdmin" or "HeadCoach" or "Coach";
        return new AccessScope(false, canEdit, info.ClubId, info.CoachTeamIds);
    }

    private static bool CanEditTeam(AccessScope scope, Team team, string effectiveRole)
    {
        if (scope.IsAdmin) return true;
        if (scope.ClubId != team.ClubId) return false;
        if (effectiveRole is "ClubAdmin" or "HeadCoach") return true;
        if (effectiveRole == "Coach") return scope.CoachTeamIds.Contains(team.Id);
        return false;
    }

    private async Task<bool> IsPlayerInTeamAsync(string userId, int teamId)
    {
        var member = await context.Members.FirstOrDefaultAsync(m => m.AppUserId == userId);
        if (member == null) return false;
        return await context.TeamMembers.AnyAsync(tm =>
            tm.TeamId == teamId && tm.MemberId == member.Id && tm.IsPlayer);
    }

    private async Task<MatchLineupDto> ToDtoAsync(MatchLineup l)
    {
        string? createdByName = null;
        if (!string.IsNullOrEmpty(l.CreatedByUserId))
        {
            var u = await userManager.FindByIdAsync(l.CreatedByUserId);
            if (u != null) createdByName = $"{u.FirstName} {u.LastName}".Trim();
        }

        return new MatchLineupDto
        {
            Id = l.Id,
            TeamId = l.TeamId,
            TeamName = l.Team?.Name,
            AppointmentId = l.AppointmentId,
            AppointmentName = l.Appointment?.Name,
            AppointmentStart = l.Appointment?.Start,
            Name = l.Name,
            FormationTemplateId = l.FormationTemplateId,
            FormationTemplate = l.FormationTemplate == null ? null : new FormationTemplateDto
            {
                Id = l.FormationTemplate.Id,
                ClubId = l.FormationTemplate.ClubId,
                Name = l.FormationTemplate.Name,
                FormationSize = l.FormationTemplate.FormationSize,
                IncludesGoalie = l.FormationTemplate.IncludesGoalie,
                IsBuiltIn = l.FormationTemplate.IsBuiltIn,
                Slots = l.FormationTemplate.Slots.OrderBy(s => s.SortOrder).Select(s => new FormationTemplateSlotDto
                {
                    Id = s.Id,
                    Position = s.Position,
                    X = s.X,
                    Y = s.Y,
                    SortOrder = s.SortOrder
                }).ToList()
            },
            FormationCount = l.FormationCount,
            IsShared = l.IsShared,
            CreatedByUserId = l.CreatedByUserId,
            CreatedByUserName = createdByName,
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt,
            Roster = l.Roster.OrderBy(r => r.SortOrder).Select(r => new LineupRosterDto
            {
                Id = r.Id,
                MemberId = r.MemberId,
                MemberFirstName = r.Member?.FirstName,
                MemberLastName = r.Member?.LastName,
                ManualName = r.ManualName,
                IsAvailable = r.IsAvailable,
                SortOrder = r.SortOrder
            }).ToList(),
            Formations = l.Formations.OrderBy(f => f.Index).Select(f => new LineupFormationDto
            {
                Id = f.Id,
                Index = f.Index,
                Label = f.Label,
                ColorKey = f.ColorKey,
                Slots = f.Slots.Select(s => new LineupSlotDto
                {
                    Id = s.Id,
                    Position = s.Position,
                    RosterId = s.RosterId
                }).ToList()
            }).ToList()
        };
    }

    private IQueryable<MatchLineup> LineupQuery() => context.MatchLineups
        .Include(l => l.Team)
        .Include(l => l.Appointment)
        .Include(l => l.FormationTemplate).ThenInclude(t => t!.Slots)
        .Include(l => l.Roster).ThenInclude(r => r.Member)
        .Include(l => l.Formations).ThenInclude(f => f.Slots);

    /// <summary>Lineup name derived from its event — "{event name} {d.M.yyyy}" (date only when the event is unnamed).</summary>
    private async Task<string?> EventLineupNameAsync(int appointmentId)
    {
        var appt = await context.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == appointmentId);
        if (appt == null) return null;
        var date = appt.Start.ToString("d.M.yyyy");
        return string.IsNullOrWhiteSpace(appt.Name) ? $"Zápas {date}" : $"{appt.Name} {date}";
    }

    /// <summary>GET /lineups?teamId=X — list lineups for a team</summary>
    [HttpGet]
    public async Task<IActionResult> GetByTeam([FromQuery] int teamId)
    {
        var scope = await GetScopeAsync();
        var team = await context.Teams.FindAsync(teamId);
        if (team == null) return NotFound();
        if (!scope.IsAdmin && team.ClubId != scope.ClubId) return NotFound();

        var lineups = await LineupQuery()
            .Where(l => l.TeamId == teamId)
            .OrderByDescending(l => l.UpdatedAt)
            .ToListAsync();

        var result = new List<MatchLineupDto>();
        foreach (var l in lineups) result.Add(await ToDtoAsync(l));
        return Ok(result);
    }

    /// <summary>GET /lineups/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var lineup = await LineupQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (lineup == null) return NotFound();

        var scope = await GetScopeAsync();
        var userId = GetCurrentUserId()!;
        var info = await clubRoleService.GetUserClubRoleAsync(userId);

        // Coach/HeadCoach/ClubAdmin/Admin in same club always see their lineups
        if (lineup.Team != null && CanEditTeam(scope, lineup.Team, info.EffectiveRole))
            return Ok(await ToDtoAsync(lineup));

        // Players see only shared lineups for their team
        if (lineup.IsShared && await IsPlayerInTeamAsync(userId, lineup.TeamId))
            return Ok(await ToDtoAsync(lineup));

        return NotFound();
    }

    /// <summary>GET /appointments/{id}/lineup — find lineup linked to appointment</summary>
    [HttpGet("/appointments/{appointmentId:int}/lineup")]
    public async Task<IActionResult> GetByAppointment(int appointmentId)
    {
        var lineup = await LineupQuery().FirstOrDefaultAsync(l => l.AppointmentId == appointmentId);
        if (lineup == null) return NoContent();

        var scope = await GetScopeAsync();
        var userId = GetCurrentUserId()!;
        var info = await clubRoleService.GetUserClubRoleAsync(userId);

        if (lineup.Team != null && CanEditTeam(scope, lineup.Team, info.EffectiveRole))
            return Ok(await ToDtoAsync(lineup));
        if (lineup.IsShared && await IsPlayerInTeamAsync(userId, lineup.TeamId))
            return Ok(await ToDtoAsync(lineup));
        return NotFound();
    }

    /// <summary>POST /lineups — create new lineup</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MatchLineupDto dto)
    {
        var scope = await GetScopeAsync();
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);

        var team = await context.Teams.FindAsync(dto.TeamId);
        if (team == null) return BadRequest(new { message = "Tým nenalezen." });
        if (!CanEditTeam(scope, team, info.EffectiveRole)) return Forbid();

        var template = await context.FormationTemplates
            .Include(t => t.Slots)
            .FirstOrDefaultAsync(t => t.Id == dto.FormationTemplateId);
        if (template == null) return BadRequest(new { message = "Šablona nenalezena." });

        if (dto.AppointmentId.HasValue)
        {
            var appt = await context.Appointments.FindAsync(dto.AppointmentId.Value);
            if (appt == null || appt.TeamId != dto.TeamId)
                return BadRequest(new { message = "Zápas nepatří k tomuto týmu." });
        }

        var now = DateTime.UtcNow;
        var eventName = dto.AppointmentId.HasValue ? await EventLineupNameAsync(dto.AppointmentId.Value) : null;
        var lineup = new MatchLineup
        {
            TeamId = dto.TeamId,
            AppointmentId = dto.AppointmentId,
            Name = eventName ?? (string.IsNullOrWhiteSpace(dto.Name) ? "Nová sestava" : dto.Name),
            FormationTemplateId = template.Id,
            FormationCount = Math.Clamp(dto.FormationCount, 1, 5),
            IsShared = dto.IsShared,
            CreatedByUserId = GetCurrentUserId(),
            CreatedAt = now,
            UpdatedAt = now
        };

        var colors = new[] { "blue", "emerald", "amber", "violet", "pink" };

        // Apply roster from DTO and remember dto-id -> entity for slot mapping
        var rosterIdMap = new Dictionary<int, LineupRoster>();
        var rosterSort = 0;
        foreach (var r in (dto.Roster ?? new List<LineupRosterDto>()).OrderBy(x => x.SortOrder))
        {
            var entity = new LineupRoster
            {
                MemberId = r.MemberId,
                ManualName = r.ManualName,
                IsAvailable = r.IsAvailable,
                SortOrder = rosterSort++
            };
            lineup.Roster.Add(entity);
            if (r.Id != 0) rosterIdMap[r.Id] = entity;
        }

        // Build formations: prefer client-provided, pad/seed missing from template
        var formationsSource = (dto.Formations ?? new List<LineupFormationDto>())
            .OrderBy(f => f.Index)
            .Take(lineup.FormationCount)
            .ToList();
        while (formationsSource.Count < lineup.FormationCount)
        {
            var i = formationsSource.Count + 1;
            formationsSource.Add(new LineupFormationDto
            {
                Index = i,
                ColorKey = colors[(i - 1) % colors.Length],
                Slots = template.Slots.OrderBy(s => s.SortOrder)
                    .Select(s => new LineupSlotDto { Position = s.Position }).ToList()
            });
        }

        var idx = 0;
        foreach (var f in formationsSource)
        {
            idx++;
            var formation = new LineupFormation
            {
                Index = idx,
                Label = f.Label,
                ColorKey = string.IsNullOrEmpty(f.ColorKey) ? colors[(idx - 1) % colors.Length] : f.ColorKey,
                Slots = (f.Slots ?? new List<LineupSlotDto>()).Select(s => new LineupSlot
                {
                    Position = s.Position,
                    Roster = s.RosterId.HasValue && rosterIdMap.TryGetValue(s.RosterId.Value, out var r) ? r : null
                }).ToList()
            };
            lineup.Formations.Add(formation);
        }

        context.MatchLineups.Add(lineup);
        await context.SaveChangesAsync();

        var saved = await LineupQuery().FirstAsync(l => l.Id == lineup.Id);
        return Ok(await ToDtoAsync(saved));
    }

    /// <summary>PUT /lineups/{id} — full update (roster + formations + slots)</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MatchLineupDto dto)
    {
        var scope = await GetScopeAsync();
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);

        var lineup = await LineupQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (lineup == null) return NotFound();
        if (lineup.Team == null || !CanEditTeam(scope, lineup.Team, info.EffectiveRole)) return Forbid();

        var template = await context.FormationTemplates
            .Include(t => t.Slots)
            .FirstOrDefaultAsync(t => t.Id == dto.FormationTemplateId);
        if (template == null) return BadRequest(new { message = "Šablona nenalezena." });

        if (dto.AppointmentId.HasValue)
        {
            var appt = await context.Appointments.FindAsync(dto.AppointmentId.Value);
            if (appt == null || appt.TeamId != lineup.TeamId)
                return BadRequest(new { message = "Zápas nepatří k tomuto týmu." });
        }

        lineup.Name = string.IsNullOrWhiteSpace(dto.Name) ? lineup.Name : dto.Name;
        lineup.AppointmentId = dto.AppointmentId;
        lineup.IsShared = dto.IsShared;
        lineup.FormationCount = Math.Clamp(dto.FormationCount, 1, 5);
        var templateChanged = lineup.FormationTemplateId != template.Id;
        lineup.FormationTemplateId = template.Id;
        lineup.UpdatedAt = DateTime.UtcNow;

        // Replace roster
        var rosterIdMap = new Dictionary<int, LineupRoster>(); // dto.Id -> entity (to map slots later)
        context.LineupRosters.RemoveRange(lineup.Roster);
        lineup.Roster.Clear();
        var sortOrder = 0;
        foreach (var r in dto.Roster.OrderBy(x => x.SortOrder))
        {
            var entity = new LineupRoster
            {
                MemberId = r.MemberId,
                ManualName = r.ManualName,
                IsAvailable = r.IsAvailable,
                SortOrder = sortOrder++
            };
            lineup.Roster.Add(entity);
            if (r.Id != 0) rosterIdMap[r.Id] = entity; // map dto id (positive db id or negative client temp id) -> new entity
        }

        // Replace formations
        context.LineupSlots.RemoveRange(lineup.Formations.SelectMany(f => f.Slots));
        context.LineupFormations.RemoveRange(lineup.Formations);
        lineup.Formations.Clear();

        var colors = new[] { "blue", "emerald", "amber", "violet", "pink" };
        var formationsToCreate = templateChanged
            ? Enumerable.Range(1, lineup.FormationCount).Select(i => new LineupFormationDto
            {
                Index = i,
                ColorKey = colors[(i - 1) % colors.Length],
                Slots = template.Slots.OrderBy(s => s.SortOrder)
                    .Select(s => new LineupSlotDto { Position = s.Position }).ToList()
            }).ToList()
            : dto.Formations
                .OrderBy(f => f.Index)
                .Take(lineup.FormationCount)
                .ToList();

        // Pad if user provided fewer formations than count
        while (formationsToCreate.Count < lineup.FormationCount)
        {
            var i = formationsToCreate.Count + 1;
            formationsToCreate.Add(new LineupFormationDto
            {
                Index = i,
                ColorKey = colors[(i - 1) % colors.Length],
                Slots = template.Slots.OrderBy(s => s.SortOrder)
                    .Select(s => new LineupSlotDto { Position = s.Position }).ToList()
            });
        }

        var idx = 0;
        foreach (var f in formationsToCreate)
        {
            idx++;
            var formation = new LineupFormation
            {
                Index = idx,
                Label = f.Label,
                ColorKey = string.IsNullOrEmpty(f.ColorKey) ? colors[(idx - 1) % colors.Length] : f.ColorKey,
                Slots = f.Slots.Select(s => new LineupSlot
                {
                    Position = s.Position,
                    Roster = s.RosterId.HasValue && rosterIdMap.TryGetValue(s.RosterId.Value, out var r) ? r : null
                }).ToList()
            };
            lineup.Formations.Add(formation);
        }

        await context.SaveChangesAsync();
        var reloaded = await LineupQuery().FirstAsync(l => l.Id == id);
        return Ok(await ToDtoAsync(reloaded));
    }

    /// <summary>
    /// POST /lineups/{sourceId}/copy?appointmentId=X — give event X its own copy of an existing lineup (a template or
    /// another event's lineup). The copy is independent: editing it never touches the source or other events.
    /// A lineup already attached to X is replaced.
    /// </summary>
    [HttpPost("{sourceId:int}/copy")]
    public async Task<IActionResult> CopyToAppointment(int sourceId, [FromQuery] int appointmentId)
    {
        var scope = await GetScopeAsync();
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);

        var source = await LineupQuery().AsNoTracking().FirstOrDefaultAsync(l => l.Id == sourceId);
        if (source == null) return NotFound();
        if (source.Team == null || !CanEditTeam(scope, source.Team, info.EffectiveRole)) return Forbid();

        var appt = await context.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == appointmentId);
        if (appt == null || appt.TeamId != source.TeamId)
            return BadRequest(new { message = "Zápas nepatří k tomuto týmu." });

        // One lineup per event: drop the current one (the DB has no cascade from roster/formations here).
        var existing = await context.MatchLineups
            .Include(l => l.Roster)
            .Include(l => l.Formations).ThenInclude(f => f.Slots)
            .Where(l => l.AppointmentId == appointmentId && l.Id != sourceId)
            .ToListAsync();
        foreach (var e in existing)
        {
            context.LineupSlots.RemoveRange(e.Formations.SelectMany(f => f.Slots));
            context.LineupFormations.RemoveRange(e.Formations);
            context.LineupRosters.RemoveRange(e.Roster);
            context.MatchLineups.Remove(e);
        }

        var now = DateTime.UtcNow;
        var copy = new MatchLineup
        {
            TeamId = source.TeamId,
            AppointmentId = appointmentId,
            Name = await EventLineupNameAsync(appointmentId) ?? source.Name,
            FormationTemplateId = source.FormationTemplateId,
            FormationCount = source.FormationCount,
            IsShared = source.IsShared,
            CreatedByUserId = GetCurrentUserId(),
            CreatedAt = now,
            UpdatedAt = now
        };
        var rosterMap = new Dictionary<int, LineupRoster>();
        foreach (var r in source.Roster.OrderBy(r => r.SortOrder))
        {
            var entity = new LineupRoster
            {
                MemberId = r.MemberId,
                ManualName = r.ManualName,
                IsAvailable = r.IsAvailable,
                SortOrder = r.SortOrder
            };
            copy.Roster.Add(entity);
            rosterMap[r.Id] = entity;
        }
        foreach (var f in source.Formations.OrderBy(f => f.Index))
        {
            copy.Formations.Add(new LineupFormation
            {
                Index = f.Index,
                Label = f.Label,
                ColorKey = f.ColorKey,
                Slots = f.Slots.Select(sl => new LineupSlot
                {
                    Position = sl.Position,
                    Roster = sl.RosterId.HasValue && rosterMap.TryGetValue(sl.RosterId.Value, out var r) ? r : null
                }).ToList()
            });
        }

        context.MatchLineups.Add(copy);
        await context.SaveChangesAsync();

        var saved = await LineupQuery().FirstAsync(l => l.Id == copy.Id);
        return Ok(await ToDtoAsync(saved));
    }

    /// <summary>DELETE /lineups/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scope = await GetScopeAsync();
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);

        var lineup = await context.MatchLineups
            .Include(l => l.Team)
            .Include(l => l.Roster)
            .Include(l => l.Formations).ThenInclude(f => f.Slots)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (lineup == null) return NotFound();
        if (lineup.Team == null || !CanEditTeam(scope, lineup.Team, info.EffectiveRole)) return Forbid();

        context.LineupSlots.RemoveRange(lineup.Formations.SelectMany(f => f.Slots));
        context.LineupFormations.RemoveRange(lineup.Formations);
        context.LineupRosters.RemoveRange(lineup.Roster);
        context.MatchLineups.Remove(lineup);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
