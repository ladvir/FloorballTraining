using System.Security.Claims;
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

        if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach" && roleInfo.ClubId.HasValue)
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
        .FirstOrDefaultAsync(m => m.Id == memberId);

    /// <summary>GET /playerskills/roster — players available to the current user (Admin/ClubAdmin/HeadCoach/Coach only).</summary>
    [HttpGet("roster")]
    public async Task<IActionResult> GetRoster()
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId());
        if (roleInfo.EffectiveRole == "User") return Forbid();

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
            var position = await positionResolver.ResolveAsync(member.Id);
            dtos.Add(new PlayerSkillRosterMemberDto
            {
                MemberId = member.Id,
                FirstName = member.FirstName,
                LastName = member.LastName,
                Position = position.ToString(),
                Teams = member.TeamMembers
                    .Where(tm => tm.Team != null)
                    .Select(tm => tm.Team!.Name)
                    .Distinct()
                    .ToList(),
            });
        }

        return Ok(dtos);
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

    private async Task<PlayerSkillCardDto> BuildCardAsync(Member member)
    {
        var position = await positionResolver.ResolveAsync(member.Id);

        var categories = await context.SkillCategories
            .Include(c => c.Skills)
            .Where(c => c.Position == position)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var skillIds = categories.SelectMany(c => c.Skills).Select(s => s.Id).ToList();
        var latestRatings = await context.PlayerSkillRatings
            .Where(r => r.MemberId == member.Id && skillIds.Contains(r.SkillId))
            .ToListAsync();
        var latestBySkill = latestRatings
            .GroupBy(r => r.SkillId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.RatedAt).First());

        var categoryDtos = new List<PlayerSkillCategoryDto>();
        foreach (var category in categories)
        {
            var skillDtos = new List<PlayerSkillDto>();
            foreach (var skill in category.Skills.OrderBy(s => s.SortOrder))
            {
                latestBySkill.TryGetValue(skill.Id, out var rating);
                skillDtos.Add(new PlayerSkillDto
                {
                    SkillId = skill.Id,
                    Name = skill.Name,
                    SortOrder = skill.SortOrder,
                    Grade = rating?.Grade,
                    TargetGrade = rating?.TargetGrade,
                    Recommendation = rating?.Recommendation,
                    RatedAt = rating?.RatedAt,
                    RatedByUserName = rating != null ? await GetUserName(rating.RatedByAppUserId) : null,
                });
            }

            categoryDtos.Add(new PlayerSkillCategoryDto
            {
                CategoryId = category.Id,
                Name = category.Name,
                SortOrder = category.SortOrder,
                Skills = skillDtos,
            });
        }

        return new PlayerSkillCardDto
        {
            MemberId = member.Id,
            FirstName = member.FirstName,
            LastName = member.LastName,
            Position = position.ToString(),
            Categories = categoryDtos,
        };
    }
}
