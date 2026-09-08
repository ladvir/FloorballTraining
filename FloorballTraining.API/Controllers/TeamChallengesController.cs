using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Coach-authored team challenges (#156). Definitions are team-scoped (no club-wide row, unlike
/// <see cref="ClubReward"/>); a derived challenge's completions are recomputed by
/// <see cref="TeamChallengeService"/> (the interceptor enqueues that on any <see cref="TeamChallenge"/>
/// write), a manual challenge is toggled here and its bonus XP derived inline. Auth mirrors
/// <c>RewardsController</c>'s per-team gate.
/// </summary>
[Authorize]
[Route("team-challenges")]
public class TeamChallengesController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    IAuditService auditService,
    TeamChallengeService teamChallenges,
    XpService xp) : BaseApiController
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>GET /team-challenges?teamId= — definitions + live progress + whether the caller may manage them.</summary>
    [HttpGet]
    public async Task<IActionResult> List(int teamId, CancellationToken ct)
    {
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId, ct);
        if (team == null) return NotFound("Team not found.");
        if (!await CanSeeTeamAsync(team)) return Forbid();

        var board = await teamChallenges.GetForTeamAsync(teamId, ct: ct);
        var canManage = await CanManageAsync(team);
        board.CanManage = canManage;
        foreach (var c in board.Challenges) c.CanManage = canManage;
        return Ok(board);
    }

    /// <summary>GET /team-challenges/team/{teamId} — read-only board for players/guardians of the same club.</summary>
    [HttpGet("team/{teamId:int}")]
    public async Task<IActionResult> ForTeam(int teamId, CancellationToken ct)
    {
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId, ct);
        if (team == null) return NotFound("Team not found.");
        if (!await CanSeeTeamAsync(team)) return Forbid();

        var board = await teamChallenges.GetForTeamAsync(teamId, ct: ct);
        // Only the currently active challenges matter to a player; hide the coach's archived ones.
        board.Challenges = board.Challenges.Where(c => c.IsActive).ToList();
        return Ok(board);
    }

    /// <summary>POST /team-challenges — create a challenge for a team. Team's Coach+ / club HeadCoach+ / Admin.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveTeamChallengeDto dto, CancellationToken ct)
    {
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == dto.TeamId, ct);
        if (team == null) return NotFound("Team not found.");
        if (!await CanManageAsync(team)) return Forbid();

        var validation = Validate(dto);
        if (validation != null) return validation;

        var challenge = new TeamChallenge { TeamId = dto.TeamId };
        Apply(dto, challenge);
        context.TeamChallenges.Add(challenge);
        await context.SaveChangesAsync(ct); // interceptor enqueues the derive-completions recompute
        await auditService.LogAsync(AuditActions.TeamChallengeCreated, nameof(TeamChallenge), challenge.Id.ToString(),
            new { dto.TeamId, dto.Name, dto.IsManual, dto.Metric, dto.Target, dto.Window, dto.RewardXp });

        var view = TeamChallengeService.ToDto(challenge);
        view.CanManage = true;
        return Ok(view);
    }

    /// <summary>PUT /team-challenges/{id} — edit a challenge. Team scope is immutable.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveTeamChallengeDto dto, CancellationToken ct)
    {
        var challenge = await context.TeamChallenges.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (challenge == null) return NotFound();
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == challenge.TeamId, ct);
        if (team == null || !await CanManageAsync(team)) return Forbid();

        dto.TeamId = challenge.TeamId; // scope immutable
        var validation = Validate(dto);
        if (validation != null) return validation;

        Apply(dto, challenge);
        await context.SaveChangesAsync(ct); // interceptor re-derives completions (target/metric/active change)
        await auditService.LogAsync(AuditActions.TeamChallengeUpdated, nameof(TeamChallenge), challenge.Id.ToString(),
            new { challenge.TeamId, dto.Name, dto.IsManual, dto.Metric, dto.Target, dto.Window, dto.RewardXp, dto.IsActive });

        var view = TeamChallengeService.ToDto(challenge);
        view.CanManage = true;
        return Ok(view);
    }

    /// <summary>DELETE /team-challenges/{id} — remove a challenge and its completions (cascade); XP is pruned.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var challenge = await context.TeamChallenges.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (challenge == null) return NotFound();
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == challenge.TeamId, ct);
        if (team == null || !await CanManageAsync(team)) return Forbid();

        context.TeamChallenges.Remove(challenge);
        await context.SaveChangesAsync(ct); // completions cascade; interceptor recompute prunes their XP
        await auditService.LogAsync(AuditActions.TeamChallengeDeleted, nameof(TeamChallenge), id.ToString(),
            new { challenge.TeamId, challenge.Name });
        return NoContent();
    }

    /// <summary>POST /team-challenges/{id}/complete — mark a MANUAL challenge done for the whole roster.</summary>
    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id, CancellationToken ct)
    {
        var challenge = await context.TeamChallenges.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (challenge == null) return NotFound();
        if (!challenge.IsManual) return BadRequest("Only a manual challenge can be completed by hand.");
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == challenge.TeamId, ct);
        if (team == null || !await CanManageAsync(team)) return Forbid();

        var roster = await context.TeamMembers.AsNoTracking()
            .Where(tm => tm.TeamId == challenge.TeamId && tm.IsPlayer && tm.Member!.IsActive)
            .Select(tm => tm.MemberId)
            .ToListAsync(ct);
        var existing = await context.TeamChallengeCompletions
            .Where(x => x.TeamChallengeId == id)
            .Select(x => x.MemberId)
            .ToListAsync(ct);
        var now = DateTime.UtcNow;
        var added = roster.Except(existing).Select(mid => new TeamChallengeCompletion
        {
            TeamChallengeId = id,
            MemberId = mid,
            PeriodKey = TeamChallengeService.ManualPeriodKey,
            CompletedAt = now,
            CompletedByUserId = UserId,
        }).ToList();

        if (added.Count > 0)
        {
            context.TeamChallengeCompletions.AddRange(added);
            await context.SaveChangesAsync(ct);
            await xp.RecomputeAllAsync(ct); // completions aren't an XP source → derive the bonus XP now
        }
        await auditService.LogAsync(AuditActions.TeamChallengeCompleted, nameof(TeamChallenge), id.ToString(),
            new { challenge.TeamId, players = roster.Count });
        return Ok(new { completed = true, players = roster.Count });
    }

    /// <summary>DELETE /team-challenges/{id}/complete — undo a manual completion; the recompute prunes its XP.</summary>
    [HttpDelete("{id:int}/complete")]
    public async Task<IActionResult> Uncomplete(int id, CancellationToken ct)
    {
        var challenge = await context.TeamChallenges.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (challenge == null) return NotFound();
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == challenge.TeamId, ct);
        if (team == null || !await CanManageAsync(team)) return Forbid();

        var rows = await context.TeamChallengeCompletions
            .Where(x => x.TeamChallengeId == id && x.CompletedByUserId != null)
            .ToListAsync(ct);
        if (rows.Count > 0)
        {
            context.TeamChallengeCompletions.RemoveRange(rows);
            await context.SaveChangesAsync(ct);
            await xp.RecomputeAllAsync(ct); // prune the now-orphaned bonus XP
        }
        await auditService.LogAsync(AuditActions.TeamChallengeUncompleted, nameof(TeamChallenge), id.ToString(),
            new { challenge.TeamId, removed = rows.Count });
        return NoContent();
    }

    // ── Mapping & validation ─────────────────────────────────────────────────

    private static void Apply(SaveTeamChallengeDto dto, TeamChallenge c)
    {
        c.Name = dto.Name.Trim();
        c.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        c.IsManual = dto.IsManual;
        c.Metric = dto.IsManual ? null : Enum.Parse<ChallengeMetric>(dto.Metric!, ignoreCase: true);
        c.Target = dto.IsManual ? 0 : Math.Max(1, dto.Target);
        c.Window = Enum.Parse<TeamChallengeWindow>(dto.Window, ignoreCase: true);
        c.StartsOn = dto.StartsOn;
        c.EndsOn = dto.EndsOn;
        c.RewardXp = Math.Max(0, dto.RewardXp);
        c.IsActive = dto.IsActive;
    }

    private static IActionResult? Validate(SaveTeamChallengeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return new BadRequestObjectResult("Name is required.");
        if (!Enum.TryParse<TeamChallengeWindow>(dto.Window, ignoreCase: true, out var window))
            return new BadRequestObjectResult("Unknown window.");
        if (window == TeamChallengeWindow.Custom && (dto.StartsOn == null || dto.EndsOn == null || dto.EndsOn < dto.StartsOn))
            return new BadRequestObjectResult("A custom window needs StartsOn and EndsOn (EndsOn ≥ StartsOn).");
        if (!dto.IsManual)
        {
            if (!Enum.TryParse<ChallengeMetric>(dto.Metric, ignoreCase: true, out _))
                return new BadRequestObjectResult("A derived challenge needs a valid metric.");
            if (dto.Target < 1) return new BadRequestObjectResult("Target must be at least 1.");
        }
        if (dto.RewardXp < 0) return new BadRequestObjectResult("RewardXp must not be negative.");
        return null;
    }

    // ── Authorization ────────────────────────────────────────────────────────

    /// <summary>Manage: any Coach+ of the team's club, a coach of THIS team, or a global Admin (mirrors rewards).</summary>
    private async Task<bool> CanManageAsync(Team team)
    {
        if (User.IsInRole("Admin")) return true;
        var info = await clubRoleService.GetUserClubRoleAsync(UserId, team.ClubId);
        if (info.ClubId == team.ClubId && info.EffectiveRole is "ClubAdmin" or "HeadCoach" or "Coach") return true;
        return info.CoachTeamIds.Contains(team.Id);
    }

    /// <summary>See: a global Admin, or anyone with a member record in the team's club (player/guardian/coach).</summary>
    private async Task<bool> CanSeeTeamAsync(Team team)
    {
        if (User.IsInRole("Admin")) return true;
        return await context.Members.AsNoTracking()
            .AnyAsync(m => m.AppUserId == UserId && m.ClubId == team.ClubId);
    }
}
