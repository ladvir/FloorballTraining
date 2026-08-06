using System.Globalization;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Derives self-completable challenges (#108) from the same coach-entered records as XP — attendance,
/// goals, home training, skill grades and tests — so completions are unfalsifiable. A challenge is a rule
/// over a rolling window (week/month/season); when a member's progress reaches the target in a window a
/// <see cref="ChallengeCompletion"/> is written once per (member, code, window). The completion then earns
/// bonus XP via the existing ledger (<see cref="XpService"/> derives it). Mirrors <see cref="BadgeService"/>.
/// ponytail: full-history rescan per run (idempotent, cheap at club scale) — same as XP/badges.
/// </summary>
public class ChallengeService(FloorballTrainingContext context)
{
    private record Contribution(int MemberId, DateTime When, int Amount);

    /// <summary>Recompute completions for every member. Returns the number of newly completed challenges.</summary>
    public async Task<int> RecomputeAllAsync(CancellationToken ct = default)
    {
        var season = await LoadSeasonResolverAsync(ct);
        var contribs = await LoadContributionsAsync(ct);

        var existing = (await context.ChallengeCompletions
                .Select(c => new { c.MemberId, c.Code, c.PeriodKey })
                .ToListAsync(ct))
            .Select(c => (c.MemberId, c.Code, c.PeriodKey))
            .ToHashSet();

        var toAdd = new List<ChallengeCompletion>();
        foreach (var def in ChallengeCatalog.All)
        {
            foreach (var q in QualifyingPeriods(def, contribs[def.Metric], season))
            {
                if (existing.Add((q.MemberId, def.Code.ToString(), q.PeriodKey)))
                    toAdd.Add(new ChallengeCompletion
                    {
                        MemberId = q.MemberId, Code = def.Code.ToString(),
                        PeriodKey = q.PeriodKey, CompletedAt = q.When,
                    });
            }
        }

        if (toAdd.Count > 0)
        {
            context.ChallengeCompletions.AddRange(toAdd);
            await context.SaveChangesAsync(ct);
        }
        return toAdd.Count;
    }

    /// <summary>A member's challenge board (#108): current-window progress for each challenge + recently earned.</summary>
    public async Task<ChallengesDto> GetChallengesAsync(int memberId, DateTime? now = null, CancellationToken ct = default)
    {
        var asOf = now ?? DateTime.UtcNow;
        var season = await LoadSeasonResolverAsync(ct);
        var contribs = await LoadContributionsAsync(ct, memberId);

        var completed = (await context.ChallengeCompletions.AsNoTracking()
                .Where(c => c.MemberId == memberId)
                .ToListAsync(ct))
            .ToDictionary(c => (c.Code, c.PeriodKey), c => c.CompletedAt);

        var active = new List<ChallengeDto>();
        foreach (var def in ChallengeCatalog.All)
        {
            var period = season.PeriodKey(memberId, asOf, def.Window);
            if (period == null) continue; // season window with no resolvable season → not offered

            var count = contribs[def.Metric]
                .Where(c => c.MemberId == memberId && season.PeriodKey(memberId, c.When, def.Window) == period)
                .Sum(c => c.Amount);
            var current = Math.Clamp(count, 0, def.Target);
            var isDone = completed.TryGetValue((def.Code.ToString(), period), out var doneAt);

            active.Add(new ChallengeDto
            {
                Code = def.Code.ToString(),
                Metric = def.Metric.ToString(),
                Window = def.Window.ToString(),
                PeriodKey = period,
                Target = def.Target,
                Current = isDone ? def.Target : current,
                Progress = isDone ? 1.0 : Math.Min(1.0, def.Target == 0 ? 1 : count / (double)def.Target),
                RewardXp = def.RewardXp,
                Completed = isDone,
                CompletedAt = isDone ? doneAt : null,
            });
        }

        var recent = completed
            .OrderByDescending(kv => kv.Value)
            .Take(10)
            .Where(kv => ChallengeCatalog.ByCode.TryGetValue(kv.Key.Code, out _))
            .Select(kv =>
            {
                var def = ChallengeCatalog.ByCode[kv.Key.Code];
                return new ChallengeDto
                {
                    Code = def.Code.ToString(), Metric = def.Metric.ToString(), Window = def.Window.ToString(),
                    PeriodKey = kv.Key.PeriodKey, Target = def.Target, Current = def.Target, Progress = 1.0,
                    RewardXp = def.RewardXp, Completed = true, CompletedAt = kv.Value,
                };
            })
            .ToList();

        return new ChallengesDto { Active = active, RecentlyCompleted = recent };
    }

    // For a challenge, group its metric's contributions into windows and yield every (member, window) that
    // reaches the target. CompletedAt = the timestamp of the last contribution that met it (stable season).
    private static IEnumerable<(int MemberId, string PeriodKey, DateTime When)> QualifyingPeriods(
        ChallengeCatalog.Def def, List<Contribution> contribs, SeasonResolver season)
    {
        var groups = contribs
            .Select(c => (c.MemberId, Period: season.PeriodKey(c.MemberId, c.When, def.Window), c.When, c.Amount))
            .Where(x => x.Period != null)
            .GroupBy(x => (x.MemberId, Period: x.Period!));

        foreach (var g in groups)
            if (g.Sum(x => x.Amount) >= def.Target)
                yield return (g.Key.MemberId, g.Key.Period, g.Max(x => x.When));
    }

    // --- Contribution loaders: each metric → (member, when, amount) events, same source data as XpService ---

    private async Task<Dictionary<ChallengeMetric, List<Contribution>>> LoadContributionsAsync(CancellationToken ct, int? memberId = null)
    {
        return new Dictionary<ChallengeMetric, List<Contribution>>
        {
            [ChallengeMetric.TrainingAttendance] = await LoadTrainingAttendanceAsync(ct, memberId),
            [ChallengeMetric.MatchGoal] = await LoadGoalsAsync(ct, memberId),
            [ChallengeMetric.HomeTraining] = await LoadHomeTrainingAsync(ct, memberId),
            [ChallengeMetric.SkillImprovement] = await LoadSkillImprovementsAsync(ct, memberId),
            [ChallengeMetric.TestPersonalRecord] = await LoadTestRecordsAsync(ct, memberId),
        };
    }

    private async Task<List<Contribution>> LoadTrainingAttendanceAsync(CancellationToken ct, int? memberId)
    {
        var rows = await context.AppointmentAttendances.AsNoTracking()
            .Where(a => a.Status == 1)
            .Where(a => memberId == null || a.MemberId == memberId)
            .Include(a => a.Appointment)
            .ToListAsync(ct);
        return rows
            .Where(a => a.Appointment?.AppointmentType == AppointmentType.Training)
            .Select(a => new Contribution(a.MemberId, a.Appointment?.Start ?? a.RecordedAt, 1))
            .ToList();
    }

    private async Task<List<Contribution>> LoadGoalsAsync(CancellationToken ct, int? memberId)
    {
        var rows = await context.StatTrackerEntries.AsNoTracking()
            .Where(e => e.Kind == 0 && e.StatTrackerParticipantId != null && e.StatTrackerMetricId != null)
            .Where(e => e.Metric!.Code == "goals")
            .Where(e => memberId == null || e.Participant!.MemberId == memberId)
            .Include(e => e.Participant)
            .Include(e => e.Metric)
            .ToListAsync(ct);
        return rows
            .Where(e => e.Participant != null)
            .Select(e => new Contribution(e.Participant!.MemberId, e.CreatedAt, e.Delta)) // Delta signed: undo cancels
            .ToList();
    }

    private async Task<List<Contribution>> LoadHomeTrainingAsync(CancellationToken ct, int? memberId)
    {
        var rows = await context.HomeTrainingLogs.AsNoTracking()
            .Where(l => l.ConfirmedAt != null && l.RejectedAt == null)
            .Where(l => memberId == null || l.MemberId == memberId)
            .Select(l => new { l.MemberId, l.LoggedAt })
            .ToListAsync(ct);
        return rows.Select(l => new Contribution(l.MemberId, l.LoggedAt, 1)).ToList();
    }

    private async Task<List<Contribution>> LoadSkillImprovementsAsync(CancellationToken ct, int? memberId)
    {
        var ratings = await context.PlayerSkillRatings.AsNoTracking()
            .Where(r => memberId == null || r.MemberId == memberId)
            .OrderBy(r => r.MemberId).ThenBy(r => r.SkillId).ThenBy(r => r.RatedAt).ThenBy(r => r.Id)
            .ToListAsync(ct);
        var result = new List<Contribution>();
        foreach (var group in ratings.GroupBy(r => new { r.MemberId, r.SkillId }))
        {
            int? prev = null;
            foreach (var r in group)
            {
                if (prev != null && r.Grade < prev) // grade 1 = best, lower is better
                    result.Add(new Contribution(r.MemberId, r.RatedAt, 1));
                prev = r.Grade;
            }
        }
        return result;
    }

    private async Task<List<Contribution>> LoadTestRecordsAsync(CancellationToken ct, int? memberId)
    {
        var results = await context.TestResults.AsNoTracking()
            .Where(t => t.NumericValue != null)
            .Where(t => memberId == null || t.MemberId == memberId)
            .Include(t => t.TestDefinition)
            .OrderBy(t => t.MemberId).ThenBy(t => t.TestDefinitionId).ThenBy(t => t.TestDate).ThenBy(t => t.Id)
            .ToListAsync(ct);
        var contribs = new List<Contribution>();
        foreach (var group in results.GroupBy(t => new { t.MemberId, t.TestDefinitionId }))
        {
            double? best = null;
            foreach (var t in group)
            {
                var value = t.NumericValue!.Value;
                var higherIsBetter = t.TestDefinition?.HigherIsBetter ?? true;
                if (best != null && (higherIsBetter ? value > best : value < best))
                    contribs.Add(new Contribution(t.MemberId, t.TestDate, 1));
                best = best == null ? value : (higherIsBetter ? Math.Max(best.Value, value) : Math.Min(best.Value, value));
            }
        }
        return contribs;
    }

    // --- Window → PeriodKey (ISO week / calendar month / resolved season), same season model as XpService ---

    private async Task<SeasonResolver> LoadSeasonResolverAsync(CancellationToken ct)
    {
        var memberClub = await context.Members.AsNoTracking().ToDictionaryAsync(m => m.Id, m => m.ClubId, ct);
        var seasonsByClub = (await context.Seasons.AsNoTracking().ToListAsync(ct))
            .Where(s => s.ClubId != null)
            .GroupBy(s => s.ClubId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());
        return new SeasonResolver(memberClub, seasonsByClub);
    }

    private sealed class SeasonResolver(
        Dictionary<int, int> memberClub,
        Dictionary<int, List<Season>> seasonsByClub)
    {
        /// <summary>Window key for a date, or null when a season window can't resolve to a season.</summary>
        public string? PeriodKey(int memberId, DateTime when, ChallengeWindow window) => window switch
        {
            ChallengeWindow.Week => $"{ISOWeek.GetYear(when)}-W{ISOWeek.GetWeekOfYear(when):00}",
            ChallengeWindow.Month => $"{when.Year}-M{when.Month:00}",
            ChallengeWindow.Season => ResolveSeason(memberId, when) is int sid ? $"S{sid}" : null,
            _ => null,
        };

        private int? ResolveSeason(int memberId, DateTime date)
        {
            if (!memberClub.TryGetValue(memberId, out var clubId) ||
                !seasonsByClub.TryGetValue(clubId, out var seasons)) return null;
            return seasons.FirstOrDefault(s => s.StartDate <= date && (s.EndDate == default || s.EndDate >= date))?.Id;
        }
    }
}
