using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
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
    IClubRoleService clubRoleService) : BaseApiController
{
    /// <summary>GET /xp/member/{memberId} — lifetime XP + per-season breakdown for a player.</summary>
    [HttpGet("member/{memberId:int}")]
    public async Task<IActionResult> MemberSummary(int memberId)
    {
        if (!await CanSeeMemberAsync(memberId)) return NotFound();
        return Ok(await xp.GetSummaryAsync(memberId));
    }

    /// <summary>POST /xp/recompute — idempotent batch derivation of the whole XP ledger (admin).</summary>
    [HttpPost("recompute")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Recompute(CancellationToken ct)
    {
        var inserted = await xp.RecomputeAllAsync(ct);
        return Ok(new { inserted });
    }

    /// <summary>GET /xp/badges/{memberId} — earned + in-progress milestone badges for a player (#97).</summary>
    [HttpGet("badges/{memberId:int}")]
    public async Task<IActionResult> Badges(int memberId, CancellationToken ct)
    {
        if (!await CanSeeMemberAsync(memberId)) return NotFound();
        return Ok(await badges.GetBadgesAsync(memberId, ct));
    }

    /// <summary>POST /xp/badges/recompute — idempotent batch badge derivation (admin, #97).</summary>
    [HttpPost("badges/recompute")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RecomputeBadges(CancellationToken ct)
        => Ok(new { inserted = await badges.RecomputeAllAsync(ct) });

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
