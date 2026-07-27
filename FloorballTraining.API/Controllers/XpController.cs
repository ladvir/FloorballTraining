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
    IClubRoleService clubRoleService) : BaseApiController
{
    /// <summary>GET /xp/member/{memberId} — lifetime XP + per-season breakdown for a player.</summary>
    [HttpGet("member/{memberId:int}")]
    public async Task<IActionResult> MemberSummary(int memberId)
    {
        var member = await context.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == memberId);
        if (member == null) return NotFound();

        if (!User.IsInRole("Admin"))
        {
            var info = await clubRoleService.GetUserClubRoleAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (member.ClubId != info.ClubId) return NotFound();
        }

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
}
