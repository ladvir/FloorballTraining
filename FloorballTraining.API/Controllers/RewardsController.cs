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
/// Real-world rewards (#105): club-wide (ClubAdmin+) and team extensions (Coach+ of the team). Config,
/// the who/when/what grant audit, and marking a reward handed over. Eligibility itself is derived by
/// <see cref="RewardService"/> in the recompute job — this controller only configures and fulfills.
/// </summary>
[Authorize]
public class RewardsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    RewardService rewards) : BaseApiController
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // ── Definitions ──────────────────────────────────────────────────────────

    /// <summary>
    /// GET /rewards?clubId=&amp;teamId= — reward definitions for a scope. With teamId, returns the club-wide
    /// rewards (inherited) plus that team's; without it, the club-wide rewards only. CanManage tells the UI
    /// whether the caller may edit (else it shows why not).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> List(int? clubId, int? teamId, CancellationToken ct)
    {
        int resolvedClubId;
        bool scopeCanManage;

        if (teamId != null)
        {
            var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId, ct);
            if (team == null) return NotFound("Team not found.");
            resolvedClubId = team.ClubId;
            scopeCanManage = await CanManageTeamRewardsAsync(teamId.Value);
        }
        else if (clubId != null)
        {
            resolvedClubId = clubId.Value;
            scopeCanManage = await CanManageClubRewardsAsync(clubId.Value);
        }
        else
        {
            return BadRequest("clubId or teamId is required.");
        }

        var rewards = await context.ClubRewards.AsNoTracking()
            .Where(r => r.ClubId == resolvedClubId && (r.TeamId == null || r.TeamId == teamId))
            .OrderBy(r => r.TeamId == null ? 0 : 1).ThenBy(r => r.Name)
            .ToListAsync(ct);

        var counts = await context.MemberRewardClaims.AsNoTracking()
            .Where(c => rewards.Select(r => r.Id).Contains(c.ClubRewardId))
            .GroupBy(c => c.ClubRewardId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Key, g => g.Count, ct);

        var clubCanManage = await CanManageClubRewardsAsync(resolvedClubId);

        var dtos = rewards.Select(r => ToDto(r, counts.GetValueOrDefault(r.Id),
            r.TeamId == null ? clubCanManage : scopeCanManage)).ToList();

        return Ok(new RewardListDto { CanManage = scopeCanManage, Rewards = dtos });
    }

    /// <summary>POST /rewards — create a reward. Club-wide needs ClubAdmin+; a team reward needs the team's Coach+.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveClubRewardDto dto, CancellationToken ct)
    {
        var validation = await ValidateAndAuthorizeAsync(dto, ct);
        if (validation != null) return validation;

        var reward = new ClubReward();
        Apply(dto, reward);
        context.ClubRewards.Add(reward);
        await context.SaveChangesAsync(ct);
        // Evaluate eligibility now (not only via the async recompute job) so already-qualifying players
        // get their claim immediately — the coach sees who to hand the reward to right after defining it.
        await rewards.RecomputeAllAsync(ct);
        var count = await context.MemberRewardClaims.CountAsync(c => c.ClubRewardId == reward.Id, ct);
        return Ok(ToDto(reward, count, true));
    }

    /// <summary>PUT /rewards/{id} — edit a reward. Same role gate as its scope.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveClubRewardDto dto, CancellationToken ct)
    {
        var reward = await context.ClubRewards.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (reward == null) return NotFound();
        if (!await CanManageRewardAsync(reward)) return Forbid();

        // Scope (club/team) is immutable on edit — keep the DTO's scope aligned with the existing row.
        dto.ClubId = reward.ClubId;
        dto.TeamId = reward.TeamId;

        var validation = ValidateTrigger(dto);
        if (validation != null) return validation;

        Apply(dto, reward);
        await context.SaveChangesAsync(ct);
        await rewards.RecomputeAllAsync(ct); // (re)evaluate eligibility immediately, e.g. after activating
        var count = await context.MemberRewardClaims.CountAsync(c => c.ClubRewardId == id, ct);
        return Ok(ToDto(reward, count, true));
    }

    /// <summary>DELETE /rewards/{id} — remove a reward and its claims (cascade).</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var reward = await context.ClubRewards.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (reward == null) return NotFound();
        if (!await CanManageRewardAsync(reward)) return Forbid();

        context.ClubRewards.Remove(reward);
        await context.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Claims (grant audit + fulfillment) ───────────────────────────────────

    /// <summary>GET /rewards/claims?clubId=&amp;teamId= — who earned what, when, and who handed it over. Coach+.</summary>
    [HttpGet("claims")]
    public async Task<IActionResult> Claims(int? clubId, int? teamId, CancellationToken ct)
    {
        int resolvedClubId;
        if (teamId != null)
        {
            var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId, ct);
            if (team == null) return NotFound("Team not found.");
            resolvedClubId = team.ClubId;
        }
        else if (clubId != null) resolvedClubId = clubId.Value;
        else return BadRequest("clubId or teamId is required.");

        if (!await CanFulfillAsync(resolvedClubId, teamId)) return Forbid();
        var canFulfill = true; // implied by the guard above

        var claims = await context.MemberRewardClaims.AsNoTracking()
            .Include(c => c.Member)
            .Include(c => c.ClubReward)
            .Where(c => c.ClubReward!.ClubId == resolvedClubId && (teamId == null || c.ClubReward.TeamId == teamId))
            .OrderByDescending(c => c.EarnedAt)
            .ToListAsync(ct);

        return Ok(await ToClaimDtosAsync(claims, canFulfill, ct));
    }

    /// <summary>POST /rewards/claims/{id}/fulfill — mark a reward physically handed over. Coach+.</summary>
    [HttpPost("claims/{id:int}/fulfill")]
    public async Task<IActionResult> Fulfill(int id, CancellationToken ct)
    {
        var claim = await context.MemberRewardClaims.Include(c => c.ClubReward).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (claim?.ClubReward == null) return NotFound();
        if (!await CanFulfillAsync(claim.ClubReward.ClubId, claim.ClubReward.TeamId)) return Forbid();

        claim.Status = RewardClaimStatus.Fulfilled;
        claim.FulfilledByUserId = UserId;
        claim.FulfilledAt = DateTime.UtcNow;
        await context.SaveChangesAsync(ct);
        return Ok((await ToClaimDtosAsync([claim], true, ct))[0]);
    }

    /// <summary>POST /rewards/claims/{id}/unfulfill — undo a hand-over marked by mistake. Coach+.</summary>
    [HttpPost("claims/{id:int}/unfulfill")]
    public async Task<IActionResult> Unfulfill(int id, CancellationToken ct)
    {
        var claim = await context.MemberRewardClaims.Include(c => c.ClubReward).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (claim?.ClubReward == null) return NotFound();
        if (!await CanFulfillAsync(claim.ClubReward.ClubId, claim.ClubReward.TeamId)) return Forbid();

        claim.Status = RewardClaimStatus.Eligible;
        claim.FulfilledByUserId = null;
        claim.FulfilledAt = null;
        await context.SaveChangesAsync(ct);
        return Ok((await ToClaimDtosAsync([claim], true, ct))[0]);
    }

    /// <summary>GET /rewards/member/{memberId} — a player's own earned rewards. Owner or club coach/admin.</summary>
    [HttpGet("member/{memberId:int}")]
    public async Task<IActionResult> MemberClaims(int memberId, CancellationToken ct)
    {
        var member = await context.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == memberId, ct);
        if (member == null) return NotFound();
        if (!await CanSeeMemberAsync(member)) return Forbid();

        var claims = await context.MemberRewardClaims.AsNoTracking()
            .Include(c => c.Member)
            .Include(c => c.ClubReward)
            .Where(c => c.MemberId == memberId)
            .OrderByDescending(c => c.EarnedAt)
            .ToListAsync(ct);

        var canFulfill = await CanFulfillAsync(member.ClubId);
        return Ok(await ToClaimDtosAsync(claims, canFulfill, ct));
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private static void Apply(SaveClubRewardDto dto, ClubReward reward)
    {
        reward.ClubId = dto.ClubId;
        reward.TeamId = dto.TeamId;
        reward.Name = dto.Name.Trim();
        reward.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        reward.TriggerType = Enum.Parse<RewardTriggerType>(dto.TriggerType, ignoreCase: true);
        reward.TriggerValue = dto.TriggerValue.Trim();
        reward.IsActive = dto.IsActive;
    }

    private static ClubRewardDto ToDto(ClubReward r, int claimCount, bool canManage) => new()
    {
        Id = r.Id,
        ClubId = r.ClubId,
        TeamId = r.TeamId,
        Name = r.Name,
        Description = r.Description,
        TriggerType = r.TriggerType.ToString(),
        TriggerValue = r.TriggerValue,
        IsActive = r.IsActive,
        ClaimCount = claimCount,
        CanManage = canManage,
    };

    private async Task<List<MemberRewardClaimDto>> ToClaimDtosAsync(List<MemberRewardClaim> claims, bool canFulfill, CancellationToken ct)
    {
        var fulfillerIds = claims.Where(c => c.FulfilledByUserId != null).Select(c => c.FulfilledByUserId!).Distinct().ToList();
        var fulfillerNames = fulfillerIds.Count == 0
            ? new Dictionary<string, string>()
            : await context.Users.AsNoTracking()
                .Where(u => fulfillerIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => $"{u.FirstName} {u.LastName}".Trim(), ct);

        return claims.Select(c => new MemberRewardClaimDto
        {
            Id = c.Id,
            MemberId = c.MemberId,
            MemberName = $"{c.Member?.FirstName} {c.Member?.LastName}".Trim(),
            ClubRewardId = c.ClubRewardId,
            RewardName = c.ClubReward?.Name ?? "",
            RewardDescription = c.ClubReward?.Description,
            TeamId = c.ClubReward?.TeamId,
            EarnedAt = c.EarnedAt,
            Status = c.Status.ToString(),
            FulfilledByUserId = c.FulfilledByUserId,
            FulfilledByName = c.FulfilledByUserId != null ? fulfillerNames.GetValueOrDefault(c.FulfilledByUserId) : null,
            FulfilledAt = c.FulfilledAt,
            CanFulfill = canFulfill,
        }).ToList();
    }

    // ── Validation & authorization ───────────────────────────────────────────

    private async Task<IActionResult?> ValidateAndAuthorizeAsync(SaveClubRewardDto dto, CancellationToken ct)
    {
        if (dto.TeamId != null)
        {
            var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == dto.TeamId, ct);
            if (team == null) return NotFound("Team not found.");
            if (team.ClubId != dto.ClubId) return BadRequest("Team does not belong to the club.");
            if (!await CanManageTeamRewardsAsync(dto.TeamId.Value)) return Forbid();
        }
        else if (!await CanManageClubRewardsAsync(dto.ClubId))
        {
            return Forbid();
        }
        return ValidateTrigger(dto);
    }

    private static IActionResult? ValidateTrigger(SaveClubRewardDto dto)
    {
        var badRequest = new BadRequestObjectResult("Invalid reward.");
        if (string.IsNullOrWhiteSpace(dto.Name)) return badRequest;
        if (!Enum.TryParse<RewardTriggerType>(dto.TriggerType, ignoreCase: true, out var type))
            return new BadRequestObjectResult("Unknown trigger type.");

        switch (type)
        {
            case RewardTriggerType.RankReached:
                if (!int.TryParse(dto.TriggerValue, out var rank) || rank < 0 || rank >= XpProgression.Ranks.Length)
                    return new BadRequestObjectResult("Trigger value must be a valid rank index.");
                break;
            case RewardTriggerType.XpThreshold:
                if (!int.TryParse(dto.TriggerValue, out var xp) || xp <= 0)
                    return new BadRequestObjectResult("Trigger value must be a positive XP threshold.");
                break;
            case RewardTriggerType.BadgeEarned:
                if (!Enum.TryParse<BadgeCode>(dto.TriggerValue, ignoreCase: true, out _))
                    return new BadRequestObjectResult("Trigger value must be a valid badge code.");
                break;
        }
        return null;
    }

    private Task<bool> CanManageRewardAsync(ClubReward r) =>
        r.TeamId == null ? CanManageClubRewardsAsync(r.ClubId) : CanManageTeamRewardsAsync(r.TeamId.Value);

    /// <summary>Club-wide rewards: ClubAdmin of this club, or a global Admin.</summary>
    private async Task<bool> CanManageClubRewardsAsync(int clubId)
    {
        if (User.IsInRole("Admin")) return true;
        var info = await clubRoleService.GetUserClubRoleAsync(UserId, clubId);
        return info.ClubId == clubId && info.EffectiveRole == "ClubAdmin";
    }

    /// <summary>Team rewards: any Coach+ of the team's club, a coach of THIS team, or a global Admin.</summary>
    private async Task<bool> CanManageTeamRewardsAsync(int teamId)
    {
        if (User.IsInRole("Admin")) return true;
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId);
        if (team == null) return false;
        var info = await clubRoleService.GetUserClubRoleAsync(UserId, team.ClubId);
        // A club-level Coach/HeadCoach/ClubAdmin (matches fulfillment), or a team-level coach recognised
        // via CoachTeamIds even without a club-level coach role.
        if (info.ClubId == team.ClubId && info.EffectiveRole is "ClubAdmin" or "HeadCoach" or "Coach") return true;
        return info.CoachTeamIds.Contains(teamId);
    }

    /// <summary>Fulfillment (mark handed over): any Coach+ of the club, the team's coach, or a global Admin.</summary>
    private async Task<bool> CanFulfillAsync(int clubId, int? teamId = null)
    {
        if (User.IsInRole("Admin")) return true;
        var info = await clubRoleService.GetUserClubRoleAsync(UserId, clubId);
        if (info.ClubId == clubId && info.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin") return true;
        return teamId != null && info.CoachTeamIds.Contains(teamId.Value);
    }

    /// <summary>A caller may see a member's rewards if admin, the linked user themselves, or club coach+.</summary>
    private async Task<bool> CanSeeMemberAsync(Member member)
    {
        if (User.IsInRole("Admin")) return true;
        if (member.AppUserId == UserId) return true;
        var info = await clubRoleService.GetUserClubRoleAsync(UserId, member.ClubId);
        return info.ClubId == member.ClubId && info.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin";
    }
}
