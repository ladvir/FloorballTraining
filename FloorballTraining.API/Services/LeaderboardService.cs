using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Builds club/team leaderboards (#98) purely by aggregating the derived <see cref="XpEvent"/> ledger —
/// no stored ranking. Seasonal XP (fair, default) and lifetime XP (career/hall-of-fame) come from the same
/// rows; ranks/stars reuse <see cref="XpProgression"/>.
/// ponytail: no age-group bucketing yet (rows carry BirthYear so a client can group). Add server-side
/// categories only if a spec pins the age bands.
/// </summary>
public class LeaderboardService(FloorballTrainingContext context)
{
    /// <summary>Days counted for the "player of the month" XP-gain window.</summary>
    private const int PlayerOfMonthDays = 30;

    public async Task<LeaderboardDto> GetAsync(int clubId, int? teamId, int? seasonId, string sort, CancellationToken ct = default)
    {
        sort = sort == "career" ? "career" : "season";
        seasonId ??= await ResolveCurrentSeasonAsync(clubId, ct);

        // Members in scope: active club players, optionally narrowed to one team.
        var membersQuery = context.Members.AsNoTracking().Where(m => m.ClubId == clubId && m.IsActive);
        if (teamId is int tid)
            membersQuery = membersQuery.Where(m => m.TeamMembers.Any(tm => tm.TeamId == tid && tm.IsPlayer));
        var members = await membersQuery
            .Select(m => new { m.Id, m.FirstName, m.LastName, m.BirthYear })
            .ToListAsync(ct);
        var ids = members.Select(m => m.Id).ToHashSet();

        var agg = (await context.XpEvents.AsNoTracking()
                .Where(e => ids.Contains(e.MemberId))
                .GroupBy(e => e.MemberId)
                .Select(g => new
                {
                    MemberId = g.Key,
                    Lifetime = g.Sum(x => x.Points),
                    Season = g.Where(x => x.SeasonId == seasonId).Sum(x => x.Points)
                })
                .ToListAsync(ct))
            .ToDictionary(x => x.MemberId);

        var rows = members.Select(m =>
        {
            agg.TryGetValue(m.Id, out var a);
            var lifetime = a?.Lifetime ?? 0;
            var season = a?.Season ?? 0;
            return new LeaderboardRowDto
            {
                MemberId = m.Id,
                Name = FormatName(m.FirstName, m.LastName),
                BirthYear = m.BirthYear,
                SeasonXp = season,
                Stars = XpProgression.Stars(season),
                LifetimeXp = lifetime,
                CareerRank = XpProgression.Career(lifetime).Rank,
                CareerRankIndex = XpProgression.Career(lifetime).RankIndex
            };
        }).ToList();

        var sorted = (sort == "career"
                ? rows.OrderByDescending(r => r.LifetimeXp).ThenBy(r => r.Name)
                : rows.OrderByDescending(r => r.SeasonXp).ThenBy(r => r.Name))
            .ToList();
        for (var i = 0; i < sorted.Count; i++) sorted[i].Position = i + 1;

        return new LeaderboardDto
        {
            SeasonId = seasonId,
            Sort = sort,
            Rows = sorted,
            PlayerOfMonth = await PlayerOfMonthAsync(ids, sorted, ct)
        };
    }

    /// <summary>
    /// Team-vs-team leaderboard for one club (#156). Aggregates the same <see cref="XpEvent"/> ledger by
    /// the player's team, so team-challenge bonus XP (already in each player's ledger) rolls up for free.
    /// Default sort is average XP per active player; a player counts for a team via an active
    /// <see cref="TeamMember"/> with <c>IsPlayer</c> (a player on two teams contributes to both).
    /// </summary>
    public async Task<TeamLeaderboardDto> GetTeamsAsync(int clubId, int? seasonId, string sort, CancellationToken ct = default)
    {
        sort = sort is "total" or "challenges" ? sort : "avg";
        seasonId ??= await ResolveCurrentSeasonAsync(clubId, ct);

        var teams = await context.Teams.AsNoTracking()
            .Where(t => t.ClubId == clubId)
            .Select(t => new { t.Id, t.Name })
            .ToListAsync(ct);
        if (teams.Count == 0) return new TeamLeaderboardDto { SeasonId = seasonId, Sort = sort };

        var teamIds = teams.Select(t => t.Id).ToList();

        // (team, member) pairs for active players of these teams.
        var roster = await context.TeamMembers.AsNoTracking()
            .Where(tm => tm.IsPlayer && tm.TeamId != null && teamIds.Contains(tm.TeamId.Value) && tm.Member!.IsActive)
            .Select(tm => new { TeamId = tm.TeamId!.Value, tm.MemberId })
            .ToListAsync(ct);

        var memberIds = roster.Select(r => r.MemberId).Distinct().ToList();
        var xpByMember = (await context.XpEvents.AsNoTracking()
                .Where(e => memberIds.Contains(e.MemberId))
                .GroupBy(e => e.MemberId)
                .Select(g => new
                {
                    MemberId = g.Key,
                    Lifetime = g.Sum(x => x.Points),
                    Season = g.Where(x => x.SeasonId == seasonId).Sum(x => x.Points),
                })
                .ToListAsync(ct))
            .ToDictionary(x => x.MemberId);

        var challengesByTeam = (await context.TeamChallengeCompletions.AsNoTracking()
                .Where(c => teamIds.Contains(c.TeamChallenge!.TeamId))
                .Select(c => new { c.TeamChallenge!.TeamId, c.TeamChallengeId, c.PeriodKey })
                .Distinct()
                .ToListAsync(ct))
            .GroupBy(x => x.TeamId)
            .ToDictionary(g => g.Key, g => g.Count());

        var rows = teams.Select(t =>
        {
            var players = roster.Where(r => r.TeamId == t.Id).Select(r => r.MemberId).ToList();
            var season = players.Sum(m => xpByMember.TryGetValue(m, out var x) ? x.Season : 0);
            var lifetime = players.Sum(m => xpByMember.TryGetValue(m, out var x) ? x.Lifetime : 0);
            return new TeamLeaderboardRowDto
            {
                TeamId = t.Id,
                Name = t.Name,
                PlayerCount = players.Count,
                SeasonXp = season,
                LifetimeXp = lifetime,
                AvgXp = players.Count == 0 ? 0 : (int)Math.Round(season / (double)players.Count),
                ChallengesCompleted = challengesByTeam.GetValueOrDefault(t.Id),
            };
        }).ToList();

        var sorted = (sort switch
            {
                "total" => rows.OrderByDescending(r => r.SeasonXp).ThenBy(r => r.Name),
                "challenges" => rows.OrderByDescending(r => r.ChallengesCompleted).ThenByDescending(r => r.AvgXp).ThenBy(r => r.Name),
                _ => rows.OrderByDescending(r => r.AvgXp).ThenByDescending(r => r.SeasonXp).ThenBy(r => r.Name),
            })
            .ToList();
        for (var i = 0; i < sorted.Count; i++) sorted[i].Position = i + 1;

        return new TeamLeaderboardDto { SeasonId = seasonId, Sort = sort, Rows = sorted };
    }

    private async Task<LeaderboardRowDto?> PlayerOfMonthAsync(HashSet<int> ids, List<LeaderboardRowDto> rows, CancellationToken ct)
    {
        var since = DateTime.UtcNow.AddDays(-PlayerOfMonthDays);
        var top = await context.XpEvents.AsNoTracking()
            .Where(e => ids.Contains(e.MemberId) && e.OccurredAt >= since)
            .GroupBy(e => e.MemberId)
            .Select(g => new { MemberId = g.Key, Xp = g.Sum(x => x.Points) })
            .OrderByDescending(x => x.Xp)
            .FirstOrDefaultAsync(ct);
        if (top == null || top.Xp <= 0) return null;

        var row = rows.FirstOrDefault(r => r.MemberId == top.MemberId);
        if (row != null) row.RecentXp = top.Xp;
        return row;
    }

    /// <summary>
    /// Leaderboard display name (user request): surname first in UPPERCASE, then the first name with
    /// only its initial capitalised — "Jan Novák" → "NOVÁK Jan". Invariant casing so accents survive.
    /// </summary>
    public static string FormatName(string firstName, string lastName)
    {
        var last = (lastName ?? string.Empty).Trim().ToUpperInvariant();
        var first = (firstName ?? string.Empty).Trim();
        if (first.Length > 0)
            first = char.ToUpperInvariant(first[0]) + first[1..].ToLowerInvariant();
        return $"{last} {first}".Trim();
    }

    /// <summary>The club's current season (contains today), else the latest by start date, else null.</summary>
    private async Task<int?> ResolveCurrentSeasonAsync(int clubId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var seasons = await context.Seasons.AsNoTracking()
            .Where(s => s.ClubId == clubId)
            .Select(s => new { s.Id, s.StartDate, s.EndDate })
            .ToListAsync(ct);
        if (seasons.Count == 0) return null;
        var current = seasons.FirstOrDefault(s => s.StartDate <= now && (s.EndDate == default || s.EndDate >= now));
        return (current ?? seasons.OrderByDescending(s => s.StartDate).First()).Id;
    }
}
