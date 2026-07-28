using System.Security.Claims;
using FloorballTraining.API.Jobs;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class XpController(
    FloorballTrainingContext context,
    XpService xp,
    BadgeService badges,
    LeaderboardService leaderboard,
    IClubRoleService clubRoleService,
    IBackgroundJobClient jobs) : BaseApiController
{
    /// <summary>GET /xp/member/{memberId} — lifetime XP + per-season breakdown for a player.</summary>
    [HttpGet("member/{memberId:int}")]
    public async Task<IActionResult> MemberSummary(int memberId)
    {
        if (!await CanSeeMemberAsync(memberId)) return NotFound();
        return Ok(await xp.GetSummaryAsync(memberId));
    }

    /// <summary>
    /// POST /xp/recompute — manual admin trigger. Enqueues the same idempotent, serialized recompute
    /// job used by the instant on-write trigger, so it can never run concurrently and never double-awards.
    /// </summary>
    [HttpPost("recompute")]
    [Authorize(Roles = "Admin")]
    public IActionResult Recompute()
    {
        jobs.Enqueue<GamificationRecomputeJob>(j => j.RunAsync(CancellationToken.None));
        return Accepted(new { queued = true });
    }

    /// <summary>GET /xp/badges/{memberId} — earned + in-progress milestone badges for a player (#97).</summary>
    [HttpGet("badges/{memberId:int}")]
    public async Task<IActionResult> Badges(int memberId, CancellationToken ct)
    {
        if (!await CanSeeMemberAsync(memberId)) return NotFound();
        return Ok(await badges.GetBadgesAsync(memberId, ct));
    }

    /// <summary>POST /xp/badges/recompute — admin trigger; enqueues the combined XP+badge recompute job (#97).</summary>
    [HttpPost("badges/recompute")]
    [Authorize(Roles = "Admin")]
    public IActionResult RecomputeBadges()
    {
        jobs.Enqueue<GamificationRecomputeJob>(j => j.RunAsync(CancellationToken.None));
        return Accepted(new { queued = true });
    }

    /// <summary>
    /// GET /xp/leaderboard — club or team leaderboard (#98). Non-admins are scoped to their own club;
    /// admins pass ?clubId. Optional ?teamId narrows to one team. sort=season (default) | career.
    /// </summary>
    [HttpGet("leaderboard")]
    public async Task<IActionResult> Leaderboard(int? clubId, int? teamId, int? seasonId, string sort = "season", CancellationToken ct = default)
    {
        int? scopeClub;
        if (User.IsInRole("Admin"))
            scopeClub = clubId;
        else
            scopeClub = (await clubRoleService.GetUserClubRoleAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!)).ClubId;

        if (scopeClub == null) return BadRequest("clubId is required.");
        return Ok(await leaderboard.GetAsync(scopeClub.Value, teamId, seasonId, sort, ct));
    }

    // ── Layer B: coach 1-click bonuses (#100) ───────────────────────────────────────────────

    /// <summary>GET /xp/awards?appointmentId= — coach bonuses recorded for one event.</summary>
    [HttpGet("awards")]
    public async Task<IActionResult> Awards(int appointmentId, CancellationToken ct)
    {
        var appt = await context.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == appointmentId, ct);
        if (appt == null) return NotFound();
        if (!await CanManageAppointmentAsync(appt)) return Forbid();

        var awards = await context.XpCoachAwards.AsNoTracking()
            .Where(a => a.AppointmentId == appointmentId)
            .OrderBy(a => a.Id)
            .Select(a => ToDto(a))
            .ToListAsync(ct);
        return Ok(awards);
    }

    /// <summary>POST /xp/awards — record a bonus. The row is the approval; XP is derived idempotently on save.</summary>
    [HttpPost("awards")]
    public async Task<IActionResult> CreateAward([FromBody] CreateXpAwardDto dto, CancellationToken ct)
    {
        if (!Enum.TryParse<AwardType>(dto.Type, ignoreCase: true, out var type))
            return BadRequest("Unknown award type.");

        var appt = await context.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == dto.AppointmentId, ct);
        if (appt == null) return NotFound("Appointment not found.");
        if (!await CanManageAppointmentAsync(appt)) return Forbid();
        if (type == AwardType.FamilyCheered && appt.AppointmentType != AppointmentType.Match)
            return BadRequest("FamilyCheered can only be awarded on a match.");
        if (!await context.Members.AnyAsync(m => m.Id == dto.MemberId, ct))
            return NotFound("Member not found.");

        var award = new XpCoachAward
        {
            AppointmentId = dto.AppointmentId,
            MemberId = dto.MemberId,
            Type = type,
            AwardedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!,
            AwardedAt = DateTime.UtcNow,
        };
        context.XpCoachAwards.Add(award);
        try
        {
            await context.SaveChangesAsync(ct); // interceptor enqueues the idempotent XP recompute
        }
        catch (DbUpdateException)
        {
            // Hits the anti-abuse unique index: duplicate bonus, or a 2nd "player of the training".
            return Conflict("This bonus is already recorded for this event.");
        }
        return Ok(ToDto(award));
    }

    /// <summary>DELETE /xp/awards/{id} — remove a bonus; the recompute prunes its now-orphaned XP.</summary>
    [HttpDelete("awards/{id:int}")]
    public async Task<IActionResult> DeleteAward(int id, CancellationToken ct)
    {
        var award = await context.XpCoachAwards.Include(a => a.Appointment).FirstOrDefaultAsync(a => a.Id == id, ct);
        if (award == null) return NotFound();
        if (award.Appointment == null || !await CanManageAppointmentAsync(award.Appointment)) return Forbid();

        context.XpCoachAwards.Remove(award);
        await context.SaveChangesAsync(ct); // interceptor enqueues the recompute → prunes the derived XP
        return NoContent();
    }

    private static XpAwardDto ToDto(XpCoachAward a) => new()
    {
        Id = a.Id,
        AppointmentId = a.AppointmentId,
        MemberId = a.MemberId,
        Type = a.Type.ToString(),
        AwardedByUserId = a.AwardedByUserId,
        AwardedAt = a.AwardedAt,
    };

    /// <summary>Only a coach of the event's team (or club-wide admin/head coach) may manage its bonuses.</summary>
    private async Task<bool> CanManageAppointmentAsync(Appointment appt)
    {
        if (User.IsInRole("Admin")) return true;
        if (appt.TeamId == null) return false;
        var info = await clubRoleService.GetUserClubRoleAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (info.EffectiveRole is "ClubAdmin" or "HeadCoach")
        {
            var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == appt.TeamId);
            return team != null && team.ClubId == info.ClubId;
        }
        return info.EffectiveRole == "Coach" && info.CoachTeamIds.Contains(appt.TeamId.Value);
    }

    /// <summary>A caller may see a member's gamification data if admin or in the same club.</summary>
    private async Task<bool> CanSeeMemberAsync(int memberId)
    {
        var member = await context.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == memberId);
        if (member == null) return false;
        if (User.IsInRole("Admin")) return true;
        var info = await clubRoleService.GetUserClubRoleAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return member.ClubId == info.ClubId;
    }
}
