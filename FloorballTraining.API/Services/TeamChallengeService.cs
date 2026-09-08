using System.Globalization;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Derives completions for coach-authored team challenges (#156). A derived challenge sums a
/// <see cref="ChallengeMetric"/> across the team roster over its window; when the team total reaches the
/// target in a window it completes for every rostered player, writing one
/// <see cref="TeamChallengeCompletion"/> per (challenge, member, window) — unfalsifiable, same source
/// records as XP. Each completion then earns the player bonus XP via <see cref="XpService"/>.
///
/// Manual challenges (<see cref="TeamChallenge.IsManual"/>) are toggled by the coach in
/// <c>TeamChallengesController</c>, not here — this service only touches derived rows
/// (<see cref="TeamChallengeCompletion.CompletedByUserId"/> = null) and reconciles them both ways: it
/// adds rows that now qualify and removes rows that no longer do (target raised, challenge deactivated
/// or switched to manual, player left the roster). Mirrors <see cref="ChallengeService"/> / Xp pruning.
/// ponytail: full-history rescan per run; roster is "rostered now", not "rostered during the window".
/// </summary>
public class TeamChallengeService(FloorballTrainingContext context, ChallengeContributions contributions)
{
    /// <summary>Window key for a manual challenge's completion rows — it has no rolling window.</summary>
    public const string ManualPeriodKey = "MANUAL";

    /// <summary>Reconcile derived completions for every active derived challenge. Returns rows added.</summary>
    public async Task<int> RecomputeAllAsync(CancellationToken ct = default)
    {
        var challenges = await context.TeamChallenges.AsNoTracking()
            .Where(c => c.IsActive && !c.IsManual && c.Metric != null)
            .ToListAsync(ct);

        var teamIds = challenges.Select(c => c.TeamId).ToHashSet();
        var roster = await LoadRosterAsync(teamIds, ct);
        var allMemberIds = roster.Values.SelectMany(x => x).Distinct().ToList();
        var contribs = await contributions.LoadAsync(ct, allMemberIds);
        var season = await LoadSeasonResolverAsync(teamIds, ct);

        // Every (challenge, member, window) the current data should have a completion for.
        var desired = new HashSet<(int ChallengeId, int MemberId, string PeriodKey)>();
        var completedAt = new Dictionary<(int ChallengeId, string PeriodKey), DateTime>();

        foreach (var c in challenges)
        {
            if (!roster.TryGetValue(c.TeamId, out var members) || members.Count == 0) continue;
            var memberSet = members.ToHashSet();
            var metricContribs = contribs.TryGetValue(c.Metric!.Value, out var list) ? list : [];

            var groups = metricContribs
                .Where(x => memberSet.Contains(x.MemberId))
                .Select(x => (x.Amount, x.When, Period: PeriodKeyFor(c, x.When, season)))
                .Where(x => x.Period != null)
                .GroupBy(x => x.Period!);

            foreach (var g in groups)
            {
                if (g.Sum(x => x.Amount) < c.Target) continue;
                completedAt[(c.Id, g.Key)] = g.Max(x => x.When);
                foreach (var m in members) desired.Add((c.Id, m, g.Key));
            }
        }

        var existing = await context.TeamChallengeCompletions
            .Where(x => x.CompletedByUserId == null)
            .ToListAsync(ct);
        var existingKeys = existing.Select(x => (x.TeamChallengeId, x.MemberId, x.PeriodKey)).ToHashSet();

        var toDelete = existing
            .Where(x => !desired.Contains((x.TeamChallengeId, x.MemberId, x.PeriodKey)))
            .ToList();
        var toAdd = desired
            .Where(k => !existingKeys.Contains((k.ChallengeId, k.MemberId, k.PeriodKey)))
            .Select(k => new TeamChallengeCompletion
            {
                TeamChallengeId = k.ChallengeId,
                MemberId = k.MemberId,
                PeriodKey = k.PeriodKey,
                CompletedAt = completedAt.GetValueOrDefault((k.ChallengeId, k.PeriodKey), DateTime.UtcNow),
            })
            .ToList();

        if (toDelete.Count > 0) context.TeamChallengeCompletions.RemoveRange(toDelete);
        if (toAdd.Count > 0) context.TeamChallengeCompletions.AddRange(toAdd);
        if (toDelete.Count > 0 || toAdd.Count > 0) await context.SaveChangesAsync(ct);
        return toAdd.Count;
    }

    /// <summary>A team's challenge board: every challenge with its current-window progress + completion.</summary>
    public async Task<TeamChallengeListDto> GetForTeamAsync(int teamId, DateTime? now = null, CancellationToken ct = default)
    {
        var asOf = now ?? DateTime.UtcNow;
        var team = await context.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == teamId, ct);
        if (team == null) return new TeamChallengeListDto();

        var challenges = await context.TeamChallenges.AsNoTracking()
            .Where(c => c.TeamId == teamId)
            .OrderByDescending(c => c.IsActive).ThenBy(c => c.Name)
            .ToListAsync(ct);
        if (challenges.Count == 0) return new TeamChallengeListDto();

        var members = await context.TeamMembers.AsNoTracking()
            .Where(tm => tm.TeamId == teamId && tm.IsPlayer && tm.Member!.IsActive)
            .Select(tm => tm.MemberId)
            .ToListAsync(ct);
        var memberSet = members.ToHashSet();
        var contribs = await contributions.LoadAsync(ct, members);
        var season = await LoadSeasonResolverAsync([teamId], ct);

        var challengeIds = challenges.Select(c => c.Id).ToHashSet();
        var completions = await context.TeamChallengeCompletions.AsNoTracking()
            .Where(x => challengeIds.Contains(x.TeamChallengeId))
            .ToListAsync(ct);

        var dtos = challenges.Select(c =>
        {
            var dto = ToDto(c);
            // Manual challenges have no rolling window — "completed" = any completion row exists.
            var period = c.IsManual ? null : CurrentPeriod(c, asOf, season);
            dto.PeriodKey = c.IsManual ? ManualPeriodKey : period;

            var rows = completions
                .Where(x => x.TeamChallengeId == c.Id && (c.IsManual || period == null || x.PeriodKey == period))
                .ToList();
            dto.Completed = rows.Count > 0;
            dto.CompletedMembers = rows.Select(x => x.MemberId).Distinct().Count();
            dto.CompletedAt = rows.Count > 0 ? rows.Max(x => x.CompletedAt) : null;

            if (!c.IsManual && c.Metric != null && period != null)
            {
                var count = (contribs.TryGetValue(c.Metric.Value, out var list) ? list : [])
                    .Where(x => memberSet.Contains(x.MemberId) && PeriodKeyFor(c, x.When, season) == period)
                    .Sum(x => x.Amount);
                dto.Current = Math.Clamp(count, 0, Math.Max(c.Target, 0));
                dto.Progress = dto.Completed ? 1.0 : Math.Min(1.0, c.Target <= 0 ? 1 : count / (double)c.Target);
            }
            else
            {
                dto.Progress = dto.Completed ? 1.0 : 0.0;
            }
            return dto;
        }).ToList();

        return new TeamChallengeListDto { Challenges = dtos };
    }

    public static TeamChallengeDto ToDto(TeamChallenge c) => new()
    {
        Id = c.Id,
        TeamId = c.TeamId,
        Name = c.Name,
        Description = c.Description,
        IsManual = c.IsManual,
        Metric = c.Metric?.ToString(),
        Target = c.Target,
        Window = c.Window.ToString(),
        StartsOn = c.StartsOn,
        EndsOn = c.EndsOn,
        RewardXp = c.RewardXp,
        IsActive = c.IsActive,
    };

    // --- Window → PeriodKey (ISO week / month / resolved season / custom range) ---

    /// <summary>The window key a contribution at <paramref name="when"/> falls into, or null if it falls
    /// outside the challenge's window (unresolvable season, or a date outside a custom range).</summary>
    private static string? PeriodKeyFor(TeamChallenge c, DateTime when, SeasonResolver season) => c.Window switch
    {
        TeamChallengeWindow.Week => $"{ISOWeek.GetYear(when)}-W{ISOWeek.GetWeekOfYear(when):00}",
        TeamChallengeWindow.Month => $"{when.Year}-M{when.Month:00}",
        TeamChallengeWindow.Season => season.Resolve(c.TeamId, when) is int sid ? $"S{sid}" : null,
        TeamChallengeWindow.Custom => c.StartsOn is { } s && c.EndsOn is { } e
            && when.Date >= s.Date && when.Date <= e.Date ? $"C{c.Id}" : null,
        _ => null,
    };

    /// <summary>The window a coach is looking at now. Custom always shows its single key so progress is
    /// visible before/after the range; the count filter still only sums contributions inside the range.</summary>
    private static string? CurrentPeriod(TeamChallenge c, DateTime asOf, SeasonResolver season) => c.Window switch
    {
        TeamChallengeWindow.Custom => c.StartsOn != null && c.EndsOn != null ? $"C{c.Id}" : null,
        _ => PeriodKeyFor(c, asOf, season),
    };

    private async Task<Dictionary<int, List<int>>> LoadRosterAsync(HashSet<int> teamIds, CancellationToken ct)
    {
        if (teamIds.Count == 0) return [];
        var rows = await context.TeamMembers.AsNoTracking()
            .Where(tm => tm.IsPlayer && tm.TeamId != null && teamIds.Contains(tm.TeamId.Value) && tm.Member!.IsActive)
            .Select(tm => new { TeamId = tm.TeamId!.Value, tm.MemberId })
            .ToListAsync(ct);
        return rows.GroupBy(x => x.TeamId).ToDictionary(g => g.Key, g => g.Select(x => x.MemberId).ToList());
    }

    private async Task<SeasonResolver> LoadSeasonResolverAsync(HashSet<int> teamIds, CancellationToken ct)
    {
        var teamClub = await context.Teams.AsNoTracking()
            .Where(t => teamIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.ClubId, ct);
        var seasonsByClub = (await context.Seasons.AsNoTracking().ToListAsync(ct))
            .Where(s => s.ClubId != null)
            .GroupBy(s => s.ClubId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());
        return new SeasonResolver(teamClub, seasonsByClub);
    }

    private sealed class SeasonResolver(Dictionary<int, int> teamClub, Dictionary<int, List<Season>> seasonsByClub)
    {
        public int? Resolve(int teamId, DateTime date)
        {
            if (!teamClub.TryGetValue(teamId, out var clubId) ||
                !seasonsByClub.TryGetValue(clubId, out var seasons)) return null;
            return seasons.FirstOrDefault(s => s.StartDate <= date && (s.EndDate == default || s.EndDate >= date))?.Id;
        }
    }
}
