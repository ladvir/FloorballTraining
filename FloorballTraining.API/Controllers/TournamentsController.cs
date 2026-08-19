using System.Security.Claims;
using System.Text.Json;
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
public class TournamentsController(
    FloorballTrainingContext context,
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService) : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private sealed record AccessScope(bool IsAdmin, int? ClubId, string EffectiveRole);

    private async Task<AccessScope> GetScopeAsync()
    {
        var userId = GetCurrentUserId()!;
        if (User.IsInRole("Admin")) return new AccessScope(true, null, "Admin");
        var info = await clubRoleService.GetUserClubRoleAsync(userId);
        return new AccessScope(false, info.ClubId, info.EffectiveRole);
    }

    private static bool CanRead(AccessScope scope, Tournament t)
    {
        if (scope.IsAdmin) return true;
        if (t.ClubId == null) return scope.EffectiveRole != "User";
        return t.ClubId == scope.ClubId;
    }

    private static bool CanEdit(AccessScope scope)
    {
        if (scope.IsAdmin) return true;
        return scope.EffectiveRole is "ClubAdmin" or "HeadCoach" or "Coach";
    }

    private static List<string> ParseFields(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private async Task<TournamentDto> ToDtoAsync(Tournament t)
    {
        string? createdByName = null;
        if (!string.IsNullOrEmpty(t.CreatedByUserId))
        {
            var u = await userManager.FindByIdAsync(t.CreatedByUserId);
            if (u != null) createdByName = $"{u.FirstName} {u.LastName}".Trim();
        }

        return new TournamentDto
        {
            Id = t.Id,
            Name = t.Name,
            Format = t.Format,
            SpecialGoalBonusPoints = t.SpecialGoalBonusPoints,
            MatchDurationSeconds = t.MatchDurationSeconds,
            Fields = ParseFields(t.FieldsJson),
            ClubId = t.ClubId,
            CreatedByUserId = t.CreatedByUserId,
            CreatedByUserName = createdByName,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            Teams = t.Teams.OrderBy(x => x.SortOrder).Select(x => new TournamentTeamDto
            {
                Id = x.Id,
                Name = x.Name,
                SortOrder = x.SortOrder,
            }).ToList(),
            SpecialTasks = t.SpecialTasks.Select(x => new TournamentSpecialTaskDto
            {
                Id = x.Id,
                Name = x.Name,
                BonusPoints = x.BonusPoints,
            }).ToList(),
            Matches = t.Matches.OrderBy(m => m.Round).Select(m => new TournamentMatchDto
            {
                Id = m.Id,
                Round = m.Round,
                Stage = m.Stage,
                Field = m.Field,
                HomeTeamId = m.HomeTeamId,
                AwayTeamId = m.AwayTeamId,
                Played = m.Played,
                HomeGoals = m.HomeGoals,
                AwayGoals = m.AwayGoals,
                HomeSpecialGoals = m.HomeSpecialGoals,
                AwaySpecialGoals = m.AwaySpecialGoals,
                HomeTaskIds = m.TaskCompletions.Where(c => c.IsHome).Select(c => c.TournamentSpecialTaskId).ToList(),
                AwayTaskIds = m.TaskCompletions.Where(c => !c.IsHome).Select(c => c.TournamentSpecialTaskId).ToList(),
            }).ToList(),
        };
    }

    private IQueryable<Tournament> Query() => context.Tournaments
        .Include(t => t.Teams)
        .Include(t => t.SpecialTasks)
        .Include(t => t.Matches).ThenInclude(m => m.TaskCompletions);

    /// <summary>GET /tournaments — list tournaments visible to user</summary>
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var scope = await GetScopeAsync();

        var q = context.Tournaments.AsQueryable();
        if (!scope.IsAdmin) q = q.Where(t => t.ClubId == null || t.ClubId == scope.ClubId);
        var list = await q.OrderByDescending(t => t.UpdatedAt)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Format,
                t.ClubId,
                t.CreatedByUserId,
                t.CreatedAt,
                t.UpdatedAt,
                TeamCount = t.Teams.Count,
                MatchCount = t.Matches.Count,
                PlayedCount = t.Matches.Count(m => m.Played),
            })
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>GET /tournaments/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var t = await Query().FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanRead(scope, t)) return NotFound();
        return Ok(await ToDtoAsync(t));
    }

    /// <summary>POST /tournaments — create</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TournamentDto dto)
    {
        var scope = await GetScopeAsync();
        if (!CanEdit(scope)) return Forbid();

        var now = DateTime.UtcNow;
        var t = new Tournament
        {
            Name = string.IsNullOrWhiteSpace(dto.Name) ? "Turnaj" : dto.Name,
            Format = string.IsNullOrEmpty(dto.Format) ? "round-robin-playoff" : dto.Format,
            SpecialGoalBonusPoints = Math.Clamp(dto.SpecialGoalBonusPoints, 0, 5),
            MatchDurationSeconds = Math.Clamp(dto.MatchDurationSeconds, 0, 5999),
            FieldsJson = JsonSerializer.Serialize(dto.Fields ?? new List<string> { "Hřiště 1" }),
            ClubId = scope.IsAdmin ? dto.ClubId : scope.ClubId,
            CreatedByUserId = GetCurrentUserId(),
            CreatedAt = now,
            UpdatedAt = now,
        };

        ApplyChildren(t, dto);

        context.Tournaments.Add(t);
        await context.SaveChangesAsync();

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    /// <summary>PUT /tournaments/{id} — replace teams/tasks/matches</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TournamentDto dto)
    {
        var t = await Query().FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanRead(scope, t) || !CanEdit(scope)) return Forbid();

        t.Name = string.IsNullOrWhiteSpace(dto.Name) ? t.Name : dto.Name;
        t.Format = string.IsNullOrEmpty(dto.Format) ? t.Format : dto.Format;
        t.SpecialGoalBonusPoints = Math.Clamp(dto.SpecialGoalBonusPoints, 0, 5);
        t.MatchDurationSeconds = Math.Clamp(dto.MatchDurationSeconds, 0, 5999);
        t.FieldsJson = JsonSerializer.Serialize(dto.Fields ?? new List<string>());
        t.UpdatedAt = DateTime.UtcNow;

        ReconcileChildren(context, t, dto);

        await context.SaveChangesAsync();

        var saved = await Query().FirstAsync(x => x.Id == t.Id);
        return Ok(await ToDtoAsync(saved));
    }

    /// <summary>DELETE /tournaments/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await Query().FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        var scope = await GetScopeAsync();
        if (!CanRead(scope, t) || !CanEdit(scope)) return Forbid();

        context.TournamentMatchTaskCompletions.RemoveRange(t.Matches.SelectMany(m => m.TaskCompletions));
        context.TournamentMatches.RemoveRange(t.Matches);
        context.TournamentSpecialTasks.RemoveRange(t.SpecialTasks);
        context.TournamentTeams.RemoveRange(t.Teams);
        context.Tournaments.Remove(t);
        await context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Build new entities from DTO and attach to tournament. Maps client temp ids → entities for FK resolution.</summary>
    private static void ApplyChildren(Tournament t, TournamentDto dto)
    {
        // Teams
        var teamMap = new Dictionary<int, TournamentTeam>();
        foreach (var td in (dto.Teams ?? new List<TournamentTeamDto>()).OrderBy(x => x.SortOrder))
        {
            var entity = new TournamentTeam
            {
                Name = td.Name,
                SortOrder = td.SortOrder,
            };
            t.Teams.Add(entity);
            if (td.Id != 0) teamMap[td.Id] = entity;
        }

        // Special tasks
        var taskMap = new Dictionary<int, TournamentSpecialTask>();
        foreach (var sd in dto.SpecialTasks ?? new List<TournamentSpecialTaskDto>())
        {
            var entity = new TournamentSpecialTask
            {
                Name = sd.Name,
                BonusPoints = sd.BonusPoints,
            };
            t.SpecialTasks.Add(entity);
            if (sd.Id != 0) taskMap[sd.Id] = entity;
        }

        // Matches (with team + task references)
        foreach (var md in dto.Matches ?? new List<TournamentMatchDto>())
        {
            var match = new TournamentMatch
            {
                Round = md.Round,
                Stage = string.IsNullOrEmpty(md.Stage) ? "rr" : md.Stage,
                Field = md.Field,
                HomeTeam = md.HomeTeamId.HasValue && teamMap.TryGetValue(md.HomeTeamId.Value, out var ht) ? ht : null,
                AwayTeam = md.AwayTeamId.HasValue && teamMap.TryGetValue(md.AwayTeamId.Value, out var at) ? at : null,
                Played = md.Played,
                HomeGoals = md.HomeGoals,
                AwayGoals = md.AwayGoals,
                HomeSpecialGoals = md.HomeSpecialGoals,
                AwaySpecialGoals = md.AwaySpecialGoals,
            };
            foreach (var tid in md.HomeTaskIds ?? new List<int>())
            {
                if (taskMap.TryGetValue(tid, out var task))
                    match.TaskCompletions.Add(new TournamentMatchTaskCompletion { TournamentSpecialTask = task, IsHome = true });
            }
            foreach (var tid in md.AwayTaskIds ?? new List<int>())
            {
                if (taskMap.TryGetValue(tid, out var task))
                    match.TaskCompletions.Add(new TournamentMatchTaskCompletion { TournamentSpecialTask = task, IsHome = false });
            }
            t.Matches.Add(match);
        }
    }

    /// <summary>
    /// Update existing children in place (matched by id) instead of wiping and re-creating them, so
    /// unchanged rows keep their database id across saves. A stable match id lets the frontend's React
    /// key-based reconciliation avoid remounting match rows (which would reset a running match timer)
    /// on every autosave, and keeps other tables that reference a match id (e.g. StatTracker) intact.
    /// </summary>
    private static void ReconcileChildren(FloorballTrainingContext context, Tournament t, TournamentDto dto)
    {
        // Teams
        var dtoTeams = dto.Teams ?? new List<TournamentTeamDto>();
        var dtoTeamIds = new HashSet<int>(dtoTeams.Where(x => x.Id > 0).Select(x => x.Id));
        var removedTeams = t.Teams.Where(x => !dtoTeamIds.Contains(x.Id)).ToList();
        context.TournamentTeams.RemoveRange(removedTeams);
        t.Teams.RemoveAll(x => removedTeams.Contains(x));

        var teamMap = new Dictionary<int, TournamentTeam>();
        foreach (var td in dtoTeams.OrderBy(x => x.SortOrder))
        {
            var entity = td.Id > 0 ? t.Teams.FirstOrDefault(x => x.Id == td.Id) : null;
            if (entity != null)
            {
                entity.Name = td.Name;
                entity.SortOrder = td.SortOrder;
            }
            else
            {
                entity = new TournamentTeam { Name = td.Name, SortOrder = td.SortOrder };
                t.Teams.Add(entity);
            }
            if (td.Id != 0) teamMap[td.Id] = entity;
        }

        // Special tasks
        var dtoTasks = dto.SpecialTasks ?? new List<TournamentSpecialTaskDto>();
        var dtoTaskIds = new HashSet<int>(dtoTasks.Where(x => x.Id > 0).Select(x => x.Id));
        var removedTasks = t.SpecialTasks.Where(x => !dtoTaskIds.Contains(x.Id)).ToList();
        context.TournamentSpecialTasks.RemoveRange(removedTasks);
        t.SpecialTasks.RemoveAll(x => removedTasks.Contains(x));

        var taskMap = new Dictionary<int, TournamentSpecialTask>();
        foreach (var sd in dtoTasks)
        {
            var entity = sd.Id > 0 ? t.SpecialTasks.FirstOrDefault(x => x.Id == sd.Id) : null;
            if (entity != null)
            {
                entity.Name = sd.Name;
                entity.BonusPoints = sd.BonusPoints;
            }
            else
            {
                entity = new TournamentSpecialTask { Name = sd.Name, BonusPoints = sd.BonusPoints };
                t.SpecialTasks.Add(entity);
            }
            if (sd.Id != 0) taskMap[sd.Id] = entity;
        }

        // Matches (with team + task references)
        var dtoMatches = dto.Matches ?? new List<TournamentMatchDto>();
        var dtoMatchIds = new HashSet<int>(dtoMatches.Where(x => x.Id > 0).Select(x => x.Id));
        var removedMatches = t.Matches.Where(x => !dtoMatchIds.Contains(x.Id)).ToList();
        context.TournamentMatchTaskCompletions.RemoveRange(removedMatches.SelectMany(x => x.TaskCompletions));
        context.TournamentMatches.RemoveRange(removedMatches);
        t.Matches.RemoveAll(x => removedMatches.Contains(x));

        foreach (var md in dtoMatches)
        {
            var entity = md.Id > 0 ? t.Matches.FirstOrDefault(x => x.Id == md.Id) : null;
            if (entity == null)
            {
                entity = new TournamentMatch();
                t.Matches.Add(entity);
            }
            entity.Round = md.Round;
            entity.Stage = string.IsNullOrEmpty(md.Stage) ? "rr" : md.Stage;
            entity.Field = md.Field;
            entity.HomeTeam = md.HomeTeamId.HasValue && teamMap.TryGetValue(md.HomeTeamId.Value, out var ht) ? ht : null;
            entity.AwayTeam = md.AwayTeamId.HasValue && teamMap.TryGetValue(md.AwayTeamId.Value, out var at) ? at : null;
            entity.Played = md.Played;
            entity.HomeGoals = md.HomeGoals;
            entity.AwayGoals = md.AwayGoals;
            entity.HomeSpecialGoals = md.HomeSpecialGoals;
            entity.AwaySpecialGoals = md.AwaySpecialGoals;

            context.TournamentMatchTaskCompletions.RemoveRange(entity.TaskCompletions);
            entity.TaskCompletions.Clear();
            foreach (var tid in md.HomeTaskIds ?? new List<int>())
            {
                if (taskMap.TryGetValue(tid, out var task))
                    entity.TaskCompletions.Add(new TournamentMatchTaskCompletion { TournamentSpecialTask = task, IsHome = true });
            }
            foreach (var tid in md.AwayTaskIds ?? new List<int>())
            {
                if (taskMap.TryGetValue(tid, out var task))
                    entity.TaskCompletions.Add(new TournamentMatchTaskCompletion { TournamentSpecialTask = task, IsHome = false });
            }
        }
    }
}
