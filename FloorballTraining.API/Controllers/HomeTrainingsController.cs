using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Self-reported home trainings (#104). A home training IS an individual <see cref="Training"/> the player
/// did alone — logging one records a <see cref="HomeTrainingLog"/> and spawns a personal calendar event.
/// XP is capped self-report: only a log the other party (guardian/coach) counter-signs earns XP, and even
/// then it is capped against non-home XP in <see cref="XpService"/>. Rate limited to one log/member/day.
/// </summary>
[Authorize]
public class HomeTrainingsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    INotificationService notificationService) : BaseApiController
{
    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin");

    // GET /members/{memberId}/home-trainings — the member's own logs (player / guardian / club staff).
    [HttpGet("/members/{memberId:int}/home-trainings")]
    public async Task<IActionResult> GetByMember(int memberId)
    {
        if (!await CanViewMember(memberId)) return Forbid();
        var logs = await context.HomeTrainingLogs.AsNoTracking()
            .Where(l => l.MemberId == memberId)
            .OrderByDescending(l => l.LoggedAt)
            .ToListAsync();
        return Ok(logs.Select(l => ToDto(l)));
    }

    // POST /members/{memberId}/home-trainings — player self-logs a completed home training.
    [HttpPost("/members/{memberId:int}/home-trainings")]
    public async Task<IActionResult> Create(int memberId, [FromBody] CreateHomeTrainingLogDto dto)
    {
        if (!await CanViewMember(memberId)) return Forbid();

        var member = await context.Members.FirstOrDefaultAsync(m => m.Id == memberId);
        if (member == null) return NotFound();

        var loggedDate = (dto.LoggedAt == default ? DateTime.UtcNow : dto.LoggedAt).Date;

        // Multiple logs per day are allowed; their counted XP for the day is capped at one team
        // training in XpService (#104 update), so no per-day insert restriction here.

        // Title comes from the chosen individual/home training, or free text.
        string title;
        if (dto.TrainingId is int tid)
        {
            var t = await context.Trainings.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == tid && x.IsIndividual && !x.IsDraft);
            if (t == null) return BadRequest(new { message = "Neznámý domácí trénink." });
            title = t.Name;
        }
        else
        {
            title = (dto.Title ?? "").Trim();
            if (title.Length == 0) return BadRequest(new { message = "Zadejte trénink." });
            if (title.Length > 200) title = title[..200];
        }

        // Personal calendar event so the home training is visible as an event (#104). Location = seeded "Doma".
        var placeId = await context.Places.Where(p => p.Name == "Doma").Select(p => p.Id).FirstOrDefaultAsync();
        Appointment? appt = null;
        if (placeId > 0)
        {
            var start = loggedDate.AddHours(18); // neutral evening slot for a home session
            appt = new Appointment
            {
                Name = title,
                Description = dto.Note,
                AppointmentType = AppointmentType.Training,
                Start = start,
                End = start.AddMinutes(dto.DurationMin is int d && d > 0 ? d : 30),
                LocationId = placeId,
                TeamId = null,
                TrainingId = dto.TrainingId,
                OwnerUserId = member.AppUserId ?? UserId(),
                CreatedByUserId = UserId(),
                CreatedAt = DateTime.UtcNow,
            };
        }

        var log = new HomeTrainingLog
        {
            MemberId = memberId,
            TrainingId = dto.TrainingId,
            Title = title,
            DurationMin = dto.DurationMin,
            Note = dto.Note,
            LoggedAt = loggedDate,
            Appointment = appt,
            CreatedAt = DateTime.UtcNow,
        };
        context.HomeTrainingLogs.Add(log);
        await context.SaveChangesAsync(); // pending → 0 XP yet; interceptor enqueues an (idempotent) recompute

        // Nudge the child's guardians to counter-sign.
        var guardianIds = await context.MemberGuardians
            .Where(g => g.MemberId == memberId)
            .Select(g => g.GuardianAppUserId)
            .ToListAsync();
        foreach (var gid in guardianIds)
            await notificationService.CreateForUserAsync(gid, "home_training_confirm",
                "Domácí trénink k potvrzení", $"{member.FirstName} zapsal(a) domácí trénink: {title}");

        return Ok(ToDto(log, member));
    }

    // GET /home-trainings/confirmations — pending logs the caller may counter-sign.
    // Admin → all; HeadCoach/ClubAdmin → whole club; Coach → members of the team(s) they coach (#104);
    // guardian → own children.
    [HttpGet("/home-trainings/confirmations")]
    public async Task<IActionResult> Confirmations()
    {
        var userId = UserId();
        var q = context.HomeTrainingLogs.AsNoTracking()
            .Include(l => l.Member)
            .Where(l => l.ConfirmedAt == null && l.RejectedAt == null);

        if (!IsAdmin())
        {
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
            if (roleInfo.EffectiveRole is "HeadCoach" or "ClubAdmin" && roleInfo.ClubId is int clubId)
            {
                q = q.Where(l => l.Member!.ClubId == clubId);
            }
            else if (roleInfo.EffectiveRole == "Coach")
            {
                var teamIds = roleInfo.CoachTeamIds;
                q = q.Where(l => context.TeamMembers.Any(tm =>
                    tm.MemberId == l.MemberId && tm.TeamId != null && teamIds.Contains(tm.TeamId.Value)));
            }
            else
            {
                q = q.Where(l => context.MemberGuardians.Any(g => g.MemberId == l.MemberId && g.GuardianAppUserId == userId));
            }
        }

        var logs = await q.OrderBy(l => l.LoggedAt).ToListAsync();
        return Ok(logs.Select(l => ToDto(l, l.Member)));
    }

    // PUT /home-trainings/{id}/confirm | /reject — 1-click counter-sign by the OTHER party.
    [HttpPut("/home-trainings/{id:int}/confirm")]
    public Task<IActionResult> Confirm(int id) => SetOutcome(id, confirm: true);

    [HttpPut("/home-trainings/{id:int}/reject")]
    public Task<IActionResult> Reject(int id) => SetOutcome(id, confirm: false);

    private async Task<IActionResult> SetOutcome(int id, bool confirm)
    {
        var log = await context.HomeTrainingLogs.FirstOrDefaultAsync(l => l.Id == id);
        if (log == null) return NotFound();
        if (!await CanConfirmForMember(log.MemberId)) return Forbid();

        var now = DateTime.UtcNow;
        log.ConfirmedByUserId = UserId();
        log.ConfirmedAt = confirm ? now : null;
        log.RejectedAt = confirm ? null : now;
        await context.SaveChangesAsync(); // interceptor → recompute → home XP appears/disappears
        return NoContent();
    }

    // DELETE /home-trainings/{id} — the player who logged it, a guardian, or club staff/admin.
    [HttpDelete("/home-trainings/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var log = await context.HomeTrainingLogs.FirstOrDefaultAsync(l => l.Id == id);
        if (log == null) return NotFound();
        if (!await CanViewMember(log.MemberId)) return Forbid();

        context.HomeTrainingLogs.Remove(log);
        if (log.AppointmentId is int apptId)
        {
            var appt = await context.Appointments.FirstOrDefaultAsync(a => a.Id == apptId);
            if (appt != null) context.Appointments.Remove(appt);
        }
        await context.SaveChangesAsync(); // recompute prunes any derived home XP
        return NoContent();
    }

    // ── authorization ────────────────────────────────────────────────────────────────────────
    // View/log: the player (owner), a guardian of the child, or club staff/admin.
    private async Task<bool> CanViewMember(int memberId)
    {
        if (IsAdmin()) return true;
        var userId = UserId();
        if (await context.Members.AnyAsync(m => m.Id == memberId && m.AppUserId == userId)) return true;
        if (await context.MemberGuardians.AnyAsync(g => g.MemberId == memberId && g.GuardianAppUserId == userId)) return true;
        return await IsClubStaffOf(memberId, userId);
    }

    // Counter-sign must be the OTHER party — a guardian of the child or club staff, never the player.
    private async Task<bool> CanConfirmForMember(int memberId)
    {
        if (IsAdmin()) return true;
        var userId = UserId();
        if (await context.MemberGuardians.AnyAsync(g => g.MemberId == memberId && g.GuardianAppUserId == userId)) return true;
        return await IsClubStaffOf(memberId, userId);
    }

    private async Task<bool> IsClubStaffOf(int memberId, string userId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin")
        {
            var clubId = await context.Members.Where(m => m.Id == memberId).Select(m => (int?)m.ClubId).FirstOrDefaultAsync();
            return clubId != null && clubId == roleInfo.ClubId;
        }
        return false;
    }

    private static HomeTrainingLogDto ToDto(HomeTrainingLog l, Member? member = null) => new()
    {
        Id = l.Id,
        MemberId = l.MemberId,
        MemberName = member != null ? $"{member.FirstName} {member.LastName}".Trim() : null,
        TrainingId = l.TrainingId,
        Title = l.Title,
        DurationMin = l.DurationMin,
        Note = l.Note,
        LoggedAt = l.LoggedAt,
        Status = l.RejectedAt != null ? "Rejected" : l.ConfirmedAt != null ? "Confirmed" : "Pending",
        ConfirmedByUserId = l.ConfirmedByUserId,
        ConfirmedAt = l.ConfirmedAt,
        RejectedAt = l.RejectedAt,
        AppointmentId = l.AppointmentId,
    };
}
