using System.Security.Claims;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Fan check-in (#103): a guardian 1-click "we're here / cheering" at their child's match. Creating the
/// row derives the child's "family cheered" bonus (deduped with any coach mark) and grows the family's
/// Fan XP. Guardian-only surface: a caller sees/cheers only children they're linked to (#102).
/// </summary>
[Authorize]
public class FanController(FloorballTrainingContext context) : BaseApiController
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    /// <summary>GET /fan/children — the caller's children, each with matches to cheer + family Fan XP + streak.</summary>
    [HttpGet("/fan/children")]
    public async Task<IActionResult> Children(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var childIds = await context.MemberGuardians.AsNoTracking()
            .Where(g => g.GuardianAppUserId == UserId)
            .Select(g => g.MemberId).Distinct().ToListAsync(ct);
        if (childIds.Count == 0) return Ok(Array.Empty<FanChildDto>());

        var children = await context.Members.AsNoTracking()
            .Where(m => childIds.Contains(m.Id))
            .Select(m => new { m.Id, m.FirstName, m.LastName }).ToListAsync(ct);

        // Each child's team ids → the matches those teams play.
        var teamLinks = await context.TeamMembers.AsNoTracking()
            .Where(tm => childIds.Contains(tm.MemberId) && tm.TeamId != null)
            .Select(tm => new { tm.MemberId, TeamId = tm.TeamId!.Value }).ToListAsync(ct);
        var teamsByChild = teamLinks.GroupBy(x => x.MemberId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.TeamId).ToHashSet());
        var allTeamIds = teamLinks.Select(x => x.TeamId).Distinct().ToList();

        var matches = allTeamIds.Count == 0
            ? new List<MatchRow>()
            : await context.Appointments.AsNoTracking()
                .Where(a => a.AppointmentType == AppointmentType.Match && a.TeamId != null && allTeamIds.Contains(a.TeamId.Value))
                .Select(a => new MatchRow(a.Id, a.Name, a.Start, a.End, a.TeamId!.Value)).ToListAsync(ct);

        // This guardian's own check-ins (drives CanCheckIn/CheckedIn) and every guardian's (drives family XP + streak).
        var myCheckins = (await context.FanCheckIns.AsNoTracking()
            .Where(f => f.GuardianAppUserId == UserId && childIds.Contains(f.MemberId))
            .Select(f => new { f.AppointmentId, f.MemberId }).ToListAsync(ct))
            .Select(c => (c.AppointmentId, c.MemberId)).ToHashSet();

        var familyCheckins = await context.FanCheckIns.AsNoTracking()
            .Where(f => childIds.Contains(f.MemberId))
            .Select(f => new { f.AppointmentId, f.MemberId }).ToListAsync(ct);
        var familyXpByChild = familyCheckins.GroupBy(c => c.MemberId)
            .ToDictionary(g => g.Key, g => g.Count() * XpRules.FanCheckInFamilyXp);
        var cheeredMatches = familyCheckins.Select(c => (c.AppointmentId, c.MemberId)).ToHashSet();

        var result = children.Select(c =>
        {
            teamsByChild.TryGetValue(c.Id, out var teamSet);
            var childMatches = teamSet == null ? new List<MatchRow>() : matches.Where(m => teamSet.Contains(m.TeamId)).ToList();

            var toShow = childMatches
                .Where(m => m.End + FanCheckIn.ClosesAfterEnd >= now)   // upcoming or still in the cheer window
                .OrderBy(m => m.Start).Take(10)
                .Select(m => new FanMatchDto
                {
                    AppointmentId = m.Id,
                    Name = m.Name,
                    Start = m.Start,
                    End = m.End,
                    CanCheckIn = FanCheckIn.WindowOpen(m.Start, m.End, now) && !myCheckins.Contains((m.Id, c.Id)),
                    CheckedIn = myCheckins.Contains((m.Id, c.Id)),
                }).ToList();

            // Cheer streak: consecutive most-recent started matches with a family check-in.
            var streak = 0;
            foreach (var m in childMatches.Where(m => m.Start <= now).OrderByDescending(m => m.Start))
            {
                if (!cheeredMatches.Contains((m.Id, c.Id))) break;
                streak++;
            }

            return new FanChildDto
            {
                MemberId = c.Id,
                FirstName = c.FirstName,
                LastName = c.LastName,
                FamilyXp = familyXpByChild.GetValueOrDefault(c.Id),
                CheerStreak = streak,
                Matches = toShow,
            };
        }).ToList();

        return Ok(result);
    }

    /// <summary>POST /fan/checkin — cheer a child at a match. The row derives the child's bonus + family XP.</summary>
    [HttpPost("/fan/checkin")]
    public async Task<IActionResult> CheckIn([FromBody] FanCheckInRequest req, CancellationToken ct)
    {
        if (!await context.MemberGuardians.AnyAsync(g => g.GuardianAppUserId == UserId && g.MemberId == req.MemberId, ct))
            return Forbid();

        var appt = await context.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == req.AppointmentId, ct);
        if (appt == null) return NotFound("Appointment not found.");
        if (appt.AppointmentType != AppointmentType.Match) return BadRequest("Check-in is only for matches.");

        // The match must be one the child actually plays (their team).
        var isChildsMatch = appt.TeamId != null && await context.TeamMembers
            .AnyAsync(tm => tm.MemberId == req.MemberId && tm.TeamId == appt.TeamId, ct);
        if (!isChildsMatch) return BadRequest("This match is not your child's.");

        if (!FanCheckIn.WindowOpen(appt.Start, appt.End, DateTime.UtcNow))
            return BadRequest("Check-in is only available around match time.");

        context.FanCheckIns.Add(new FanCheckIn
        {
            AppointmentId = req.AppointmentId,
            MemberId = req.MemberId,
            GuardianAppUserId = UserId,
            CheckedInAt = DateTime.UtcNow,
        });
        try
        {
            await context.SaveChangesAsync(ct); // interceptor enqueues the idempotent XP recompute
        }
        catch (DbUpdateException)
        {
            return Conflict("You have already checked in for this match.");
        }
        return Ok();
    }

    private readonly record struct MatchRow(int Id, string? Name, DateTime Start, DateTime End, int TeamId);
}
