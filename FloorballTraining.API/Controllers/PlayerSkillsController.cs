using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Player skill card API for FloTr Player (mobile, milestone #14, etapa #80) and the
/// web app follow-on (#91). Reuses ClubRoleService/EffectiveRole for authorization —
/// no separate permission logic. Read access (roster/card/history) is club-scoped for
/// every role, team-scoped for Coach; only Coach-and-above may write (batch save).
/// </summary>
[Authorize]
[Route("playerskills")]
public class PlayerSkillsController(
    FloorballTrainingContext context,
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService,
    IPlayerPositionResolver positionResolver,
    IPlayerSkillCatalogService skillCatalogService,
    IAuditService auditService)
    : BaseApiController
{
    private string GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private async Task<string?> GetUserName(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user != null ? $"{user.FirstName} {user.LastName}".Trim() : null;
    }

    /// <summary>Team ids accessible to the current user (mirrors RatingsController/TestResultsController).</summary>
    private async Task<List<int>> GetAccessibleTeamIdsAsync(ClubRoleInfo roleInfo)
    {
        if (roleInfo.EffectiveRole == "Admin")
            return await context.Teams.Select(t => t.Id).ToListAsync();

        if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach" or "User" && roleInfo.ClubId.HasValue)
            return await context.Teams
                .Where(t => t.ClubId == roleInfo.ClubId.Value)
                .Select(t => t.Id)
                .ToListAsync();

        if (roleInfo.EffectiveRole == "Coach")
        {
            var teamIds = roleInfo.CoachTeamIds;
            if (teamIds.Count == 0 && roleInfo.ClubId.HasValue)
                teamIds = await context.Teams
                    .Where(t => t.ClubId == roleInfo.ClubId.Value)
                    .Select(t => t.Id)
                    .ToListAsync();
            return teamIds;
        }

        return [];
    }

    /// <summary>
    /// Read access: Admin anywhere; ClubAdmin/HeadCoach/User (player) anywhere in their own
    /// club (players may browse teammates' cards read-only); Coach only for their own teams.
    /// </summary>
    private async Task<bool> CanReadMemberAsync(Member member, ClubRoleInfo roleInfo)
    {
        if (roleInfo.EffectiveRole == "Admin") return true;
        if (member.ClubId != roleInfo.ClubId) return false;

        if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach" or "User") return true;

        if (roleInfo.EffectiveRole == "Coach")
        {
            var teamIds = await GetAccessibleTeamIdsAsync(roleInfo);
            var memberTeamIds = member.TeamMembers
                .Where(tm => tm.TeamId.HasValue)
                .Select(tm => tm.TeamId!.Value);
            return memberTeamIds.Any(teamIds.Contains);
        }

        return false;
    }

    /// <summary>Write access (batch save): same scoping as read, but never for a plain player.</summary>
    private async Task<bool> CanWriteMemberAsync(Member member, ClubRoleInfo roleInfo)
    {
        if (roleInfo.EffectiveRole == "User") return false;
        return await CanReadMemberAsync(member, roleInfo);
    }

    private Task<Member?> LoadMemberAsync(int memberId) => context.Members
        .Include(m => m.TeamMembers).ThenInclude(tm => tm.Team)
        .Include(m => m.Club)
        .FirstOrDefaultAsync(m => m.Id == memberId);

    /// <summary>
    /// GET /playerskills/roster — players available to the current user: club-wide for
    /// Admin/ClubAdmin/HeadCoach and for a plain player (etapa #85 "Režim prohlížení" —
    /// a player may browse their whole club's roster read-only), own team(s) only for Coach.
    /// </summary>
    [HttpGet("roster")]
    public async Task<IActionResult> GetRoster()
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId());

        var teamIds = await GetAccessibleTeamIdsAsync(roleInfo);

        var memberIds = await context.TeamMembers
            .Where(tm => tm.IsPlayer && tm.TeamId.HasValue && teamIds.Contains(tm.TeamId.Value))
            .Select(tm => tm.MemberId)
            .Distinct()
            .ToListAsync();

        var members = await context.Members
            .Include(m => m.TeamMembers).ThenInclude(tm => tm.Team)
            .Where(m => memberIds.Contains(m.Id))
            .OrderBy(m => m.LastName).ThenBy(m => m.FirstName)
            .ToListAsync();

        var dtos = new List<PlayerSkillRosterMemberDto>();
        foreach (var member in members)
        {
            var positions = await positionResolver.ResolveAsync(member.Id);
            dtos.Add(new PlayerSkillRosterMemberDto
            {
                MemberId = member.Id,
                FirstName = member.FirstName,
                LastName = member.LastName,
                Position = PositionLabel(positions),
                TeamRole = TeamRoleLabel(member),
                BirthYear = member.BirthYear,
                Teams = member.TeamMembers
                    .Where(tm => tm.Team != null)
                    .Select(tm => tm.Team!.Name)
                    .Distinct()
                    .ToList(),
            });
        }

        return Ok(dtos);
    }

    /// <summary>
    /// GET /playerskills/me — the current user's own skill card (FlotrPlayer home screen for
    /// the Hráč account type, #84). Mirrors the AppUserId self-lookup pattern already used by
    /// LineupsController/RatingsController rather than adding a generic /members/me endpoint.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyCard()
    {
        var userId = GetCurrentUserId();
        var member = await context.Members
            .Include(m => m.TeamMembers).ThenInclude(tm => tm.Team)
            .Include(m => m.Club)
            .FirstOrDefaultAsync(m => m.AppUserId == userId);
        if (member == null) return NotFound();

        var card = await BuildCardAsync(member);

        await auditService.LogAsync(AuditActions.PlayerSkillCardViewed, nameof(Member),
            member.Id.ToString(), new { MemberName = $"{member.FirstName} {member.LastName}" });

        return Ok(card);
    }

    /// <summary>GET /playerskills/member/{memberId} — the player's skill card, audit-logged.</summary>
    [HttpGet("member/{memberId:int}")]
    public async Task<IActionResult> GetCard(int memberId)
    {
        var member = await LoadMemberAsync(memberId);
        if (member == null) return NotFound();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId());
        if (!await CanReadMemberAsync(member, roleInfo)) return Forbid();

        var card = await BuildCardAsync(member);

        await auditService.LogAsync(AuditActions.PlayerSkillCardViewed, nameof(Member),
            memberId.ToString(), new { MemberName = $"{member.FirstName} {member.LastName}" });

        return Ok(card);
    }

    /// <summary>GET /playerskills/member/{memberId}/skill/{skillId}/history — full rating history for one skill.</summary>
    [HttpGet("member/{memberId:int}/skill/{skillId:int}/history")]
    public async Task<IActionResult> GetSkillHistory(int memberId, int skillId)
    {
        var member = await LoadMemberAsync(memberId);
        if (member == null) return NotFound();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId());
        if (!await CanReadMemberAsync(member, roleInfo)) return Forbid();

        var ratings = await context.PlayerSkillRatings
            .Where(r => r.MemberId == memberId && r.SkillId == skillId)
            .OrderBy(r => r.RatedAt)
            .ToListAsync();

        var dtos = new List<PlayerSkillHistoryEntryDto>();
        foreach (var r in ratings)
            dtos.Add(new PlayerSkillHistoryEntryDto
            {
                Grade = r.Grade,
                TargetGrade = r.TargetGrade,
                Recommendation = r.Recommendation,
                RatedAt = r.RatedAt,
                RatedByUserName = await GetUserName(r.RatedByAppUserId),
            });

        return Ok(dtos);
    }

    /// <summary>PUT /playerskills/member/{memberId} — batch save; inserts new history rows, never overwrites old ones.</summary>
    [HttpPut("member/{memberId:int}")]
    public async Task<IActionResult> SaveBatch(int memberId, [FromBody] PlayerSkillBatchUpdateDto dto)
    {
        var member = await LoadMemberAsync(memberId);
        if (member == null) return NotFound();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId());
        if (!await CanWriteMemberAsync(member, roleInfo)) return Forbid();

        if (dto.Items.Count == 0) return BadRequest(new { message = "Žádné dovednosti k uložení." });

        foreach (var item in dto.Items)
        {
            if (item.Grade is < 1 or > 5)
                return BadRequest(new { message = "Známka musí být v rozsahu 1-5." });
            if (item.TargetGrade is < 1 or > 5)
                return BadRequest(new { message = "Cílová známka musí být v rozsahu 1-5." });
        }

        var skillIds = dto.Items.Select(i => i.SkillId).Distinct().ToList();
        var validSkillIds = await context.Skills
            .Where(s => skillIds.Contains(s.Id))
            .Select(s => s.Id)
            .ToListAsync();
        if (validSkillIds.Count != skillIds.Count)
            return BadRequest(new { message = "Neplatná dovednost." });

        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var item in dto.Items)
        {
            context.PlayerSkillRatings.Add(new PlayerSkillRating
            {
                MemberId = memberId,
                SkillId = item.SkillId,
                Grade = item.Grade,
                TargetGrade = item.TargetGrade,
                Recommendation = item.Recommendation,
                RatedAt = now,
                RatedByAppUserId = userId,
            });
        }

        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.PlayerSkillCardUpdated, nameof(Member),
            memberId.ToString(), new { SkillCount = dto.Items.Count });

        var card = await BuildCardAsync(member);
        return Ok(card);
    }

    /// <summary>PUT /playerskills/member/{memberId}/role — set the member's explicit player role (Trenér+ only).</summary>
    [HttpPut("member/{memberId:int}/role")]
    public async Task<IActionResult> UpdateRole(int memberId, [FromBody] UpdateMemberSkillPositionDto dto)
    {
        var member = await LoadMemberAsync(memberId);
        if (member == null) return NotFound();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId());
        if (!await CanWriteMemberAsync(member, roleInfo)) return Forbid();

        if (!Enum.TryParse<MemberSkillPosition>(dto.Position, out var position))
            return BadRequest(new { message = "Neplatná pozice." });

        var existing = await context.MemberPlayerRoles.FirstOrDefaultAsync(r => r.MemberId == memberId);
        if (existing == null)
            context.MemberPlayerRoles.Add(new MemberPlayerRole { MemberId = memberId, Position = position });
        else
            existing.Position = position;

        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.MemberSkillPositionUpdated, nameof(Member),
            memberId.ToString(), new { Position = dto.Position });

        var card = await BuildCardAsync(member);
        return Ok(card);
    }

    /// <summary>GET /playerskills/catalog — flat list of all skills (any position), for admin pickers (e.g. linking a test to a skill).</summary>
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog()
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId());
        if (roleInfo.EffectiveRole == "User") return Forbid();

        var categories = await context.SkillCategories
            .Include(c => c.Skills)
            .OrderBy(c => c.Position).ThenBy(c => c.SortOrder)
            .ToListAsync();

        var entries = categories
            .SelectMany(c => c.Skills.OrderBy(s => s.SortOrder).Select(s => new SkillCatalogEntryDto
            {
                SkillId = s.Id,
                SkillName = s.Name,
                CategoryId = c.Id,
                CategoryName = c.Name,
                Position = c.Position.ToString(),
            }))
            .ToList();

        return Ok(entries);
    }

    private static string PositionLabel(IReadOnlyList<SkillCategoryPosition> positions) =>
        positions.Count > 1 ? "Both" : positions[0].ToString();

    /// <summary>Mirrors MemberDto.TeamRole(isCoach, isPlayer) — does this member also coach any team.</summary>
    private static string TeamRoleLabel(Member member) =>
        member.TeamMembers.Any(tm => tm.IsCoach) ? "PlayerCoach" : "Player";

    private async Task<PlayerSkillCardDto> BuildCardAsync(Member member)
    {
        var positions = await positionResolver.ResolveAsync(member.Id);
        var categoryDtos = await skillCatalogService.BuildCategoriesAsync(member.Id, positions);

        var explicitRole = await context.MemberPlayerRoles.AsNoTracking()
            .FirstOrDefaultAsync(r => r.MemberId == member.Id);

        return new PlayerSkillCardDto
        {
            MemberId = member.Id,
            FirstName = member.FirstName,
            LastName = member.LastName,
            Position = PositionLabel(positions),
            ExplicitRole = explicitRole?.Position.ToString(),
            TeamRole = TeamRoleLabel(member),
            ClubName = member.Club?.Name ?? string.Empty,
            BirthYear = member.BirthYear,
            Teams = member.TeamMembers
                .Where(tm => tm.Team != null)
                .Select(tm => tm.Team!.Name)
                .Distinct()
                .ToList(),
            Categories = categoryDtos,
        };
    }
}
