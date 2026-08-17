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
    ChallengeService challenges,
    LeaderboardService leaderboard,
    IClubRoleService clubRoleService,
    IAuditService auditService,
    IBackgroundJobClient jobs) : BaseApiController
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

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

    /// <summary>GET /xp/badges/{memberId} — earned + in-progress milestone badges for a player (#97).
    /// A coach+ sees locked badges too (with progress); a plain player only sees badges they've earned.</summary>
    [HttpGet("badges/{memberId:int}")]
    public async Task<IActionResult> Badges(int memberId, CancellationToken ct)
    {
        if (!await CanSeeMemberAsync(memberId)) return NotFound();
        var list = await badges.GetBadgesAsync(memberId, ct);
        return Ok(await IsCoachForMemberAsync(memberId) ? list : list.Where(b => b.Earned).ToList());
    }

    /// <summary>GET /xp/challenges/{memberId} — active self-completable challenges (progress) + recently earned (#108).</summary>
    [HttpGet("challenges/{memberId:int}")]
    public async Task<IActionResult> Challenges(int memberId, CancellationToken ct)
    {
        if (!await CanSeeMemberAsync(memberId)) return NotFound();
        return Ok(await challenges.GetChallengesAsync(memberId, ct: ct));
    }

    /// <summary>POST /xp/badges/recompute — admin trigger; enqueues the combined XP+badge recompute job (#97).</summary>
    [HttpPost("badges/recompute")]
    [Authorize(Roles = "Admin")]
    public IActionResult RecomputeBadges()
    {
        jobs.Enqueue<GamificationRecomputeJob>(j => j.RunAsync(CancellationToken.None));
        return Accepted(new { queued = true });
    }

    /// <summary>GET /xp/count-from?clubId= — the club's XP reset cutoff (admin-only setting): source
    /// records older than this date are excluded from the derived ledger. Null = no cutoff.</summary>
    [HttpGet("count-from")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetXpCountFrom(int clubId, CancellationToken ct)
    {
        var date = await context.Clubs.AsNoTracking()
            .Where(c => c.Id == clubId)
            .Select(c => (DateTime?)c.XpCountFromDate)
            .FirstOrDefaultAsync(ct);
        return Ok(new { clubId, xpCountFromDate = date });
    }

    /// <summary>
    /// PUT /xp/count-from — sets (or clears, with date=null) the club's XP reset cutoff. Underlying
    /// attendance/stats/home-training/etc. records are never touched — only their XP contribution is
    /// ignored going forward. Enqueues an immediate recompute so the change takes effect right away
    /// instead of waiting for incidental club activity elsewhere to trigger one.
    /// </summary>
    [HttpPut("count-from")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetXpCountFrom([FromBody] SetXpCountFromDto dto, CancellationToken ct)
    {
        var club = await context.Clubs.FirstOrDefaultAsync(c => c.Id == dto.ClubId, ct);
        if (club == null) return NotFound();

        club.XpCountFromDate = dto.XpCountFromDate;
        await context.SaveChangesAsync(ct);
        jobs.Enqueue<GamificationRecomputeJob>(j => j.RunAsync(CancellationToken.None));
        return Ok(new { clubId = club.Id, xpCountFromDate = club.XpCountFromDate });
    }

    /// <summary>
    /// GET /xp/leaderboard — club or team leaderboard (#98). Non-admins are scoped to their own club;
    /// admins pass ?clubId. Optional ?teamId narrows to one team. sort=season (default) | career.
    /// </summary>
    [HttpGet("leaderboard")]
    public async Task<IActionResult> Leaderboard(int? clubId, int? teamId, int? seasonId, string sort = "season", CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        // A guardian (#102) may see only their own children's placement (GET /guardian/children),
        // never the full club žebříček with every other child's name and XP.
        if (!User.IsInRole("Admin") && await context.IsGuardianAsync(userId, ct)) return Forbid();

        int? scopeClub;
        if (User.IsInRole("Admin"))
            scopeClub = clubId;
        else
            scopeClub = (await clubRoleService.GetUserClubRoleAsync(userId)).ClubId;

        if (scopeClub == null) return BadRequest("clubId is required.");
        return Ok(await leaderboard.GetAsync(scopeClub.Value, teamId, seasonId, sort, ct));
    }

    /// <summary>
    /// GET /xp/rules — the member-facing "How to earn XP" catalog (#107): every earnable event with its
    /// effective club point value (#106 override, else default), reward layer and who triggers it.
    /// Available to any signed-in member; the club is resolved from the caller (admin may pass ?clubId).
    /// </summary>
    [HttpGet("rules")]
    public async Task<IActionResult> RulesCatalog(int? clubId, CancellationToken ct)
    {
        int? scopeClub = User.IsInRole("Admin") ? clubId : (await clubRoleService.GetUserClubRoleAsync(UserId)).ClubId;
        var clubWide = scopeClub == null
            ? new Dictionary<XpEventType, int>()
            : await context.XpRuleConfigs.AsNoTracking()
                .Where(c => c.ClubId == scopeClub && c.TeamId == null)
                .ToDictionaryAsync(c => c.EventType, c => c.Points, ct);

        var catalog = XpRules.ConfigurableTypes.Select(type => new XpRuleCatalogItemDto
        {
            Code = type.ToString(),
            Points = clubWide.TryGetValue(type, out var p) ? p : XpRules.PointsFor(type),
            Layer = XpRules.LayerOf(type),
            Trigger = XpRules.TriggerOf(type),
            SelfActionable = XpRules.IsSelfActionable(type),
        }).ToList();
        return Ok(catalog);
    }

    // ── Configurable XP values (#106): club-wide HeadCoach+, per-team the team's Coach+ ──────

    /// <summary>
    /// GET /xp/rules/config?clubId=&amp;teamId= — the 12 point values for a scope. teamId → the team's view
    /// (own team overrides + inherited club-effective values); clubId only → the club-wide view.
    /// </summary>
    [HttpGet("rules/config")]
    public async Task<IActionResult> GetRulesConfig(int? clubId, int? teamId, CancellationToken ct)
    {
        int resolvedClubId;
        if (teamId != null)
        {
            var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId, ct);
            if (team == null) return NotFound("Team not found.");
            resolvedClubId = team.ClubId;
            if (!await CanManageTeamXpRulesAsync(teamId.Value)) return Forbid();
        }
        else if (clubId != null)
        {
            resolvedClubId = clubId.Value;
            if (!await CanManageClubXpRulesAsync(resolvedClubId)) return Forbid();
        }
        else return BadRequest("clubId or teamId is required.");

        return Ok(await BuildRulesConfigAsync(resolvedClubId, teamId, ct));
    }

    /// <summary>
    /// PUT /xp/rules/config — save a scope's overrides. A value equal to the inherited one stores no row
    /// (reset = fall back to inherit). Saving enqueues the idempotent recompute, which re-prices the ledger.
    /// </summary>
    [HttpPut("rules/config")]
    public async Task<IActionResult> UpdateRulesConfig([FromBody] UpdateXpRulesRequest req, CancellationToken ct)
    {
        int clubId;
        if (req.TeamId != null)
        {
            var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == req.TeamId, ct);
            if (team == null) return NotFound("Team not found.");
            clubId = team.ClubId;
            if (req.ClubId != 0 && req.ClubId != clubId) return BadRequest("Team does not belong to the club.");
            if (!await CanManageTeamXpRulesAsync(req.TeamId.Value)) return Forbid();
        }
        else
        {
            clubId = req.ClubId;
            if (clubId == 0) return BadRequest("clubId is required.");
            if (!await CanManageClubXpRulesAsync(clubId)) return Forbid();
        }

        // Club-wide values only matter as the inherited baseline at team scope.
        var clubWide = req.TeamId == null
            ? new Dictionary<XpEventType, int>()
            : await context.XpRuleConfigs.AsNoTracking()
                .Where(c => c.ClubId == clubId && c.TeamId == null)
                .ToDictionaryAsync(c => c.EventType, c => c.Points, ct);
        int Inherited(XpEventType t) => req.TeamId == null
            ? XpRules.PointsFor(t)
            : (clubWide.TryGetValue(t, out var p) ? p : XpRules.PointsFor(t));

        var existing = await context.XpRuleConfigs
            .Where(c => c.ClubId == clubId && c.TeamId == req.TeamId)
            .ToListAsync(ct);
        var byType = existing.ToDictionary(c => c.EventType);

        foreach (var item in req.Items)
        {
            if (!Enum.TryParse<XpEventType>(item.EventType, ignoreCase: true, out var type)) continue;
            if (!XpRules.ConfigurableTypes.Contains(type)) continue;
            if (req.TeamId != null && !XpRules.TeamScopableTypes.Contains(type)) continue; // no team override here
            if (item.Points < 0) return BadRequest("Points must not be negative.");

            if (item.Points == Inherited(type)) // reset → drop the override row so it inherits
            {
                if (byType.TryGetValue(type, out var row)) context.XpRuleConfigs.Remove(row);
                continue;
            }
            if (byType.TryGetValue(type, out var existingRow))
                existingRow.Points = item.Points;
            else
                context.XpRuleConfigs.Add(new XpRuleConfig
                {
                    ClubId = clubId, TeamId = req.TeamId, EventType = type, Points = item.Points,
                });
        }

        await context.SaveChangesAsync(ct); // interceptor enqueues the re-pricing recompute
        await auditService.LogAsync(AuditActions.XpRulesUpdated, nameof(XpRuleConfig), $"{clubId}/{req.TeamId?.ToString() ?? "club"}",
            new { clubId, req.TeamId, req.Items });

        return Ok(await BuildRulesConfigAsync(clubId, req.TeamId, ct));
    }

    private async Task<List<XpRuleConfigDto>> BuildRulesConfigAsync(int clubId, int? teamId, CancellationToken ct)
    {
        var rows = await context.XpRuleConfigs.AsNoTracking()
            .Where(c => c.ClubId == clubId && (c.TeamId == null || c.TeamId == teamId))
            .ToListAsync(ct);
        var clubWide = rows.Where(c => c.TeamId == null).ToDictionary(c => c.EventType, c => c.Points);
        var teamRows = teamId == null
            ? new Dictionary<XpEventType, int>()
            : rows.Where(c => c.TeamId == teamId).ToDictionary(c => c.EventType, c => c.Points);

        return XpRules.ConfigurableTypes.Select(type =>
        {
            var def = XpRules.PointsFor(type);
            var clubEffective = clubWide.TryGetValue(type, out var cp) ? cp : def;
            var teamScopable = XpRules.TeamScopableTypes.Contains(type);
            if (teamId == null)
            {
                var hasClub = clubWide.TryGetValue(type, out var clubOwn);
                return new XpRuleConfigDto
                {
                    EventType = type.ToString(),
                    DefaultPoints = def,
                    InheritedPoints = def,
                    Points = hasClub ? clubOwn : def,
                    IsCustomized = hasClub,
                    TeamScopable = teamScopable,
                };
            }
            var hasTeam = teamScopable && teamRows.TryGetValue(type, out var teamOwn);
            return new XpRuleConfigDto
            {
                EventType = type.ToString(),
                DefaultPoints = def,
                InheritedPoints = clubEffective,
                Points = hasTeam ? teamRows[type] : clubEffective,
                IsCustomized = hasTeam,
                TeamScopable = teamScopable,
            };
        }).ToList();
    }

    /// <summary>Club-wide XP values: HeadCoach+ of this club (or ClubAdmin), or a global Admin.</summary>
    private async Task<bool> CanManageClubXpRulesAsync(int clubId)
    {
        if (User.IsInRole("Admin")) return true;
        var info = await clubRoleService.GetUserClubRoleAsync(UserId, clubId);
        return info.ClubId == clubId && info.EffectiveRole is "HeadCoach" or "ClubAdmin";
    }

    /// <summary>Per-team XP values: any Coach+ of the team's club, a coach of THIS team, or a global Admin.</summary>
    private async Task<bool> CanManageTeamXpRulesAsync(int teamId)
    {
        if (User.IsInRole("Admin")) return true;
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId);
        if (team == null) return false;
        var info = await clubRoleService.GetUserClubRoleAsync(UserId, team.ClubId);
        if (info.ClubId == team.ClubId && info.EffectiveRole is "ClubAdmin" or "HeadCoach" or "Coach") return true;
        return info.CoachTeamIds.Contains(teamId);
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

    /// <summary>A coach+ (or admin) of the member's club may see locked badges; a plain player may not.</summary>
    private async Task<bool> IsCoachForMemberAsync(int memberId)
    {
        if (User.IsInRole("Admin")) return true;
        var member = await context.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == memberId);
        if (member == null) return false;
        var info = await clubRoleService.GetUserClubRoleAsync(UserId, member.ClubId);
        return info.ClubId == member.ClubId && info.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin";
    }
}
