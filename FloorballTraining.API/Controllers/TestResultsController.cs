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

[Authorize]
public class TestResultsController(
    FloorballTrainingContext context,
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task<bool> IsCoachOrAboveAsync()
    {
        if (User.IsInRole("Admin")) return true;
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        return info.EffectiveRole is "Admin" or "HeadCoach" or "Coach";
    }

    private async Task<string?> GetUserName(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user != null ? $"{user.FirstName} {user.LastName}".Trim() : null;
    }

    private string? ComputeColourCode(TestResult result, TestDefinition testDef, Member member)
    {
        if (testDef.TestType == TestType.Grade)
        {
            // For grade tests, colour is on the GradeOption itself
            if (result.GradeOption?.Colour != null)
                return result.GradeOption.Colour;
            return null;
        }

        if (result.NumericValue == null) return null;

        // Find matching colour range for this member's age group and gender
        var memberAgeGroupIds = member.TeamMembers
            .Select(tm => tm.Team?.AgeGroupId)
            .Where(id => id != null)
            .Distinct()
            .ToList();

        TestColourRange? range = null;

        // Try to find exact match (age group + gender)
        foreach (var ageGroupId in memberAgeGroupIds)
        {
            range = testDef.ColourRanges.FirstOrDefault(c =>
                c.AgeGroupId == ageGroupId && c.Gender == member.Gender);
            if (range != null) break;
        }

        // Fallback: match age group only
        if (range == null)
        {
            foreach (var ageGroupId in memberAgeGroupIds)
            {
                range = testDef.ColourRanges.FirstOrDefault(c =>
                    c.AgeGroupId == ageGroupId && c.Gender == null);
                if (range != null) break;
            }
        }

        // Fallback: match gender only
        range ??= testDef.ColourRanges.FirstOrDefault(c =>
            c.AgeGroupId == null && c.Gender == member.Gender);

        // Fallback: universal range
        range ??= testDef.ColourRanges.FirstOrDefault(c =>
            c.AgeGroupId == null && c.Gender == null);

        if (range == null) return null;

        var value = result.NumericValue.Value;

        if (range.GreenFrom.HasValue && range.GreenTo.HasValue &&
            value >= range.GreenFrom.Value && value <= range.GreenTo.Value)
            return "green";

        if (range.YellowFrom.HasValue && range.YellowTo.HasValue &&
            value >= range.YellowFrom.Value && value <= range.YellowTo.Value)
            return "yellow";

        return "red";
    }

    private async Task<TestResultDto> ToDto(TestResult r)
    {
        var testDef = r.TestDefinition ?? await context.TestDefinitions
            .Include(t => t.ColourRanges)
            .FirstOrDefaultAsync(t => t.Id == r.TestDefinitionId);

        var member = r.Member ?? await context.Members
            .Include(m => m.TeamMembers).ThenInclude(tm => tm.Team)
            .FirstOrDefaultAsync(m => m.Id == r.MemberId);

        return new TestResultDto
        {
            Id = r.Id,
            TestDefinitionId = r.TestDefinitionId,
            TestName = testDef?.Name,
            MemberId = r.MemberId,
            MemberName = member != null ? $"{member.FirstName} {member.LastName}" : null,
            NumericValue = r.NumericValue,
            GradeOptionId = r.GradeOptionId,
            GradeLabel = r.GradeOption?.Label,
            TestDate = r.TestDate,
            Note = r.Note,
            RecordedByUserId = r.RecordedByUserId,
            RecordedByUserName = await GetUserName(r.RecordedByUserId),
            ColourCode = testDef != null && member != null ? ComputeColourCode(r, testDef, member) : null,
            CreatedAt = r.CreatedAt
        };
    }

    private async Task<List<int>> GetAccessibleTeamIdsAsync()
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);

        if (roleInfo.EffectiveRole == "Admin")
            return await context.Teams.Select(t => t.Id).ToListAsync();

        if (roleInfo.EffectiveRole == "HeadCoach" && roleInfo.ClubId.HasValue)
            return await context.Teams
                .Where(t => t.ClubId == roleInfo.ClubId.Value)
                .Select(t => t.Id)
                .ToListAsync();

        if (roleInfo.EffectiveRole == "Coach")
            return roleInfo.CoachTeamIds;

        return [];
    }

    private async Task<bool> CanAccessTeam(int teamId)
    {
        var ids = await GetAccessibleTeamIdsAsync();
        return ids.Contains(teamId);
    }

    private async Task<bool> CanAccessMember(int memberId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole == "Admin") return true;

        var member = await context.Members.FindAsync(memberId);
        if (member == null || member.ClubId != roleInfo.ClubId) return false;

        if (roleInfo.EffectiveRole == "HeadCoach") return true;

        if (roleInfo.EffectiveRole == "Coach")
        {
            var accessibleTeamIds = await GetAccessibleTeamIdsAsync();
            var memberTeamIds = await context.TeamMembers
                .Where(tm => tm.MemberId == memberId && tm.TeamId.HasValue)
                .Select(tm => tm.TeamId!.Value)
                .ToListAsync();
            return memberTeamIds.Any(id => accessibleTeamIds.Contains(id));
        }

        return false;
    }

    /// <summary>GET /testresults/member/{memberId}</summary>
    [HttpGet("member/{memberId:int}")]
    public async Task<IActionResult> GetByMember(int memberId)
    {
        if (!await CanAccessMember(memberId)) return NotFound();

        var results = await context.TestResults
            .Include(r => r.TestDefinition).ThenInclude(t => t!.ColourRanges)
            .Include(r => r.Member).ThenInclude(m => m!.TeamMembers).ThenInclude(tm => tm.Team)
            .Include(r => r.GradeOption)
            .Where(r => r.MemberId == memberId)
            .OrderByDescending(r => r.TestDate)
            .ToListAsync();

        var dtos = new List<TestResultDto>();
        foreach (var r in results)
            dtos.Add(await ToDto(r));

        return Ok(dtos);
    }

    /// <summary>GET /testresults/member/{memberId}/test/{testDefinitionId}</summary>
    [HttpGet("member/{memberId:int}/test/{testDefinitionId:int}")]
    public async Task<IActionResult> GetMemberTestHistory(int memberId, int testDefinitionId)
    {
        if (!await CanAccessMember(memberId)) return NotFound();

        var results = await context.TestResults
            .Include(r => r.TestDefinition).ThenInclude(t => t!.ColourRanges)
            .Include(r => r.Member).ThenInclude(m => m!.TeamMembers).ThenInclude(tm => tm.Team)
            .Include(r => r.GradeOption)
            .Where(r => r.MemberId == memberId && r.TestDefinitionId == testDefinitionId)
            .OrderBy(r => r.TestDate)
            .ToListAsync();

        var dtos = new List<TestResultDto>();
        foreach (var r in results)
            dtos.Add(await ToDto(r));

        return Ok(dtos);
    }

    /// <summary>GET /testresults/team/{teamId}</summary>
    [HttpGet("team/{teamId:int}")]
    public async Task<IActionResult> GetByTeam(int teamId)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();
        if (!await CanAccessTeam(teamId)) return NotFound();

        var memberIds = await context.TeamMembers
            .Where(tm => tm.TeamId == teamId && tm.IsPlayer)
            .Select(tm => tm.MemberId)
            .ToListAsync();

        // Get latest result per member per test
        var results = await context.TestResults
            .Include(r => r.TestDefinition).ThenInclude(t => t!.ColourRanges)
            .Include(r => r.Member).ThenInclude(m => m!.TeamMembers).ThenInclude(tm => tm.Team)
            .Include(r => r.GradeOption)
            .Where(r => memberIds.Contains(r.MemberId))
            .ToListAsync();

        var latestResults = results
            .GroupBy(r => new { r.MemberId, r.TestDefinitionId })
            .Select(g => g.OrderByDescending(r => r.TestDate).First())
            .ToList();

        var dtos = new List<TestResultDto>();
        foreach (var r in latestResults)
            dtos.Add(await ToDto(r));

        return Ok(dtos);
    }

    /// <summary>GET /testresults/team/{teamId}/test/{testDefinitionId}</summary>
    [HttpGet("team/{teamId:int}/test/{testDefinitionId:int}")]
    public async Task<IActionResult> GetTeamTest(int teamId, int testDefinitionId)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();
        if (!await CanAccessTeam(teamId)) return NotFound();

        var memberIds = await context.TeamMembers
            .Where(tm => tm.TeamId == teamId && tm.IsPlayer)
            .Select(tm => tm.MemberId)
            .ToListAsync();

        var results = await context.TestResults
            .Include(r => r.TestDefinition).ThenInclude(t => t!.ColourRanges)
            .Include(r => r.Member).ThenInclude(m => m!.TeamMembers).ThenInclude(tm => tm.Team)
            .Include(r => r.GradeOption)
            .Where(r => memberIds.Contains(r.MemberId) && r.TestDefinitionId == testDefinitionId)
            .OrderByDescending(r => r.TestDate)
            .ToListAsync();

        var dtos = new List<TestResultDto>();
        foreach (var r in results)
            dtos.Add(await ToDto(r));

        return Ok(dtos);
    }

    /// <summary>POST /testresults</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TestResultDto dto)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();

        var userId = GetCurrentUserId()!;

        var testDef = await context.TestDefinitions.FindAsync(dto.TestDefinitionId);
        if (testDef == null) return NotFound("Test nenalezen.");

        var member = await context.Members.FindAsync(dto.MemberId);
        if (member == null) return NotFound("Hráč nenalezen.");

        if (!await CanAccessMember(dto.MemberId)) return NotFound("Hráč nenalezen.");

        var result = new TestResult
        {
            TestDefinitionId = dto.TestDefinitionId,
            MemberId = dto.MemberId,
            NumericValue = dto.NumericValue,
            GradeOptionId = dto.GradeOptionId,
            TestDate = dto.TestDate,
            Note = dto.Note,
            RecordedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        context.TestResults.Add(result);
        await context.SaveChangesAsync();

        // Reload for DTO
        result = await context.TestResults
            .Include(r => r.TestDefinition).ThenInclude(t => t!.ColourRanges)
            .Include(r => r.Member).ThenInclude(m => m!.TeamMembers).ThenInclude(tm => tm.Team)
            .Include(r => r.GradeOption)
            .FirstAsync(r => r.Id == result.Id);

        return Ok(await ToDto(result));
    }

    /// <summary>POST /testresults/batch</summary>
    [HttpPost("batch")]
    public async Task<IActionResult> CreateBatch([FromBody] List<TestResultDto> dtos)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();

        foreach (var dto in dtos)
        {
            if (!await CanAccessMember(dto.MemberId))
                return Forbid();
        }

        var userId = GetCurrentUserId()!;
        var results = new List<TestResult>();

        foreach (var dto in dtos)
        {
            var result = new TestResult
            {
                TestDefinitionId = dto.TestDefinitionId,
                MemberId = dto.MemberId,
                NumericValue = dto.NumericValue,
                GradeOptionId = dto.GradeOptionId,
                TestDate = dto.TestDate,
                Note = dto.Note,
                RecordedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            context.TestResults.Add(result);
            results.Add(result);
        }

        await context.SaveChangesAsync();
        return Ok(new { count = results.Count });
    }

    /// <summary>PUT /testresults/{id}</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TestResultDto dto)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();

        var result = await context.TestResults.FindAsync(id);
        if (result == null) return NotFound();

        result.NumericValue = dto.NumericValue;
        result.GradeOptionId = dto.GradeOptionId;
        result.TestDate = dto.TestDate;
        result.Note = dto.Note;

        await context.SaveChangesAsync();

        result = await context.TestResults
            .Include(r => r.TestDefinition).ThenInclude(t => t!.ColourRanges)
            .Include(r => r.Member).ThenInclude(m => m!.TeamMembers).ThenInclude(tm => tm.Team)
            .Include(r => r.GradeOption)
            .FirstAsync(r => r.Id == result.Id);

        return Ok(await ToDto(result));
    }

    /// <summary>DELETE /testresults/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();

        var result = await context.TestResults.FindAsync(id);
        if (result == null) return NotFound();

        context.TestResults.Remove(result);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
