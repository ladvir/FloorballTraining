using System.Security.Claims;
using FloorballTraining.API.Dtos.Audit;
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
/// AI usage analytics (Feat12 #45, etapa #76): who used which provider, how much and
/// for what — per club, user and team. Admin sees any club; ClubAdmin/HeadCoach are
/// hard-scoped to their own club (a foreign clubId is a 403); everyone else has no
/// access. Rows are metadata only — prompt content is never stored.
/// </summary>
[Authorize]
public class AiUsageController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService) : BaseApiController
{
    private const int MaxPageSize = 100;

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin");

    /// <summary>Resolves the effective club filter, or an error result for foreign/no access.</summary>
    private async Task<(int? ClubId, ActionResult? Error)> ResolveClubScopeAsync(int? requestedClubId)
    {
        if (IsAdmin()) return (requestedClubId, null);

        var memberships = await clubRoleService.GetAllUserClubRolesAsync(CurrentUserId);
        var managed = memberships
            .Where(m => m.EffectiveRole is "ClubAdmin" or "HeadCoach")
            .Select(m => m.ClubId)
            .ToList();
        if (managed.Count == 0)
            return (null, StatusCode(StatusCodes.Status403Forbidden));

        if (requestedClubId.HasValue)
            return managed.Contains(requestedClubId.Value)
                ? (requestedClubId, null)
                : (null, StatusCode(StatusCodes.Status403Forbidden));

        return (managed[0], null);
    }

    private IQueryable<AiUsageLog> FilteredLogs(
        int? clubId, int? teamId, string? userId, AiFeature? feature, AiProvider? provider,
        DateTime? from, DateTime? to)
    {
        var query = context.AiUsageLogs.AsQueryable();
        if (clubId.HasValue) query = query.Where(l => l.ClubId == clubId.Value);
        if (teamId.HasValue) query = query.Where(l => l.TeamId == teamId.Value);
        if (!string.IsNullOrEmpty(userId)) query = query.Where(l => l.UserId == userId);
        if (feature.HasValue) query = query.Where(l => l.Feature == feature.Value);
        if (provider.HasValue) query = query.Where(l => l.Provider == provider.Value);
        if (from.HasValue) query = query.Where(l => l.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(l => l.CreatedAt < to.Value.AddDays(1));
        return query;
    }

    private async Task<Dictionary<string, string>> UserNamesAsync(IEnumerable<string> userIds)
    {
        var ids = userIds.Distinct().ToList();
        return await context.Users
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => ($"{u.FirstName} {u.LastName}").Trim());
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AiUsageSummaryDto>> GetSummary(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? clubId,
        [FromQuery] int? teamId,
        [FromQuery] string? userId,
        [FromQuery] AiFeature? feature,
        [FromQuery] AiProvider? provider)
    {
        var (scopedClubId, error) = await ResolveClubScopeAsync(clubId);
        if (error != null) return error;

        var rows = await FilteredLogs(scopedClubId, teamId, userId, feature, provider, from, to)
            .Select(l => new
            {
                l.UserId, l.TeamId, l.Feature, l.Provider,
                l.InputTokens, l.OutputTokens, l.DurationMs, l.Success, l.CreatedAt
            })
            .ToListAsync();

        var summary = new AiUsageSummaryDto
        {
            Totals = new AiUsageTotalsDto
            {
                Calls = rows.Count,
                InputTokens = rows.Sum(r => (long)r.InputTokens),
                OutputTokens = rows.Sum(r => (long)r.OutputTokens),
                ErrorRatePct = rows.Count > 0
                    ? Math.Round((double)rows.Count(r => !r.Success) / rows.Count * 100, 1)
                    : 0,
                AvgDurationMs = rows.Count > 0 ? Math.Round(rows.Average(r => r.DurationMs), 0) : 0,
            },
            ByDay = rows
                .GroupBy(r => new { Date = r.CreatedAt.Date, r.Feature })
                .OrderBy(g => g.Key.Date)
                .Select(g => new AiUsageByDayDto
                {
                    Date = g.Key.Date.ToString("yyyy-MM-dd"),
                    Feature = g.Key.Feature,
                    Calls = g.Count(),
                    InputTokens = g.Sum(r => (long)r.InputTokens),
                    OutputTokens = g.Sum(r => (long)r.OutputTokens),
                })
                .ToList(),
            ByFeature = rows
                .GroupBy(r => r.Feature)
                .Select(g => new AiUsageByFeatureDto
                {
                    Feature = g.Key,
                    Calls = g.Count(),
                    InputTokens = g.Sum(r => (long)r.InputTokens),
                    OutputTokens = g.Sum(r => (long)r.OutputTokens),
                })
                .OrderByDescending(f => f.Calls)
                .ToList(),
            ByProvider = rows
                .GroupBy(r => r.Provider)
                .Select(g => new AiUsageByProviderDto
                {
                    Provider = g.Key,
                    Calls = g.Count(),
                    InputTokens = g.Sum(r => (long)r.InputTokens),
                    OutputTokens = g.Sum(r => (long)r.OutputTokens),
                })
                .OrderByDescending(p => p.Calls)
                .ToList(),
        };

        var userGroups = rows
            .GroupBy(r => r.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Calls = g.Count(),
                InputTokens = g.Sum(r => (long)r.InputTokens),
                OutputTokens = g.Sum(r => (long)r.OutputTokens),
            })
            .OrderByDescending(u => u.Calls)
            .Take(10)
            .ToList();
        var names = await UserNamesAsync(userGroups.Select(u => u.UserId));
        summary.ByUser = userGroups
            .Select(u => new AiUsageByUserDto
            {
                UserId = u.UserId,
                UserName = names.GetValueOrDefault(u.UserId, "?"),
                Calls = u.Calls,
                InputTokens = u.InputTokens,
                OutputTokens = u.OutputTokens,
            })
            .ToList();

        var teamGroups = rows
            .Where(r => r.TeamId.HasValue)
            .GroupBy(r => r.TeamId!.Value)
            .Select(g => new
            {
                TeamId = g.Key,
                Calls = g.Count(),
                InputTokens = g.Sum(r => (long)r.InputTokens),
                OutputTokens = g.Sum(r => (long)r.OutputTokens),
            })
            .OrderByDescending(t => t.Calls)
            .ToList();
        var teamIds = teamGroups.Select(t => t.TeamId).ToList();
        var teamNames = await context.Teams
            .Where(t => teamIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Name);
        summary.ByTeam = teamGroups
            .Select(t => new AiUsageByTeamDto
            {
                TeamId = t.TeamId,
                TeamName = teamNames.GetValueOrDefault(t.TeamId, $"#{t.TeamId}"),
                Calls = t.Calls,
                InputTokens = t.InputTokens,
                OutputTokens = t.OutputTokens,
            })
            .ToList();

        return summary;
    }

    [HttpGet("logs")]
    public async Task<ActionResult<PagedResult<AiUsageLogDto>>> GetLogs(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? clubId,
        [FromQuery] int? teamId,
        [FromQuery] string? userId,
        [FromQuery] AiFeature? feature,
        [FromQuery] AiProvider? provider,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (scopedClubId, error) = await ResolveClubScopeAsync(clubId);
        if (error != null) return error;

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = FilteredLogs(scopedClubId, teamId, userId, feature, provider, from, to)
            .OrderByDescending(l => l.Id);

        var total = await query.CountAsync();
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var names = await UserNamesAsync(rows.Select(r => r.UserId));
        var items = rows.Select(l => new AiUsageLogDto
        {
            Id = l.Id,
            CreatedAt = l.CreatedAt,
            UserName = names.GetValueOrDefault(l.UserId, "?"),
            ClubId = l.ClubId,
            TeamId = l.TeamId,
            MemberId = l.MemberId,
            Feature = l.Feature,
            Provider = l.Provider,
            Model = l.Model,
            CredentialSource = l.CredentialSource,
            InputTokens = l.InputTokens,
            OutputTokens = l.OutputTokens,
            DurationMs = l.DurationMs,
            Success = l.Success,
            ErrorType = l.ErrorType,
        }).ToList();

        return new PagedResult<AiUsageLogDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }
}
