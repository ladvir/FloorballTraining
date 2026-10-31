using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Derives collectible milestone badges (#97) from the same coach-entered records as XP — attendance,
/// match stats and seasons — so they are unfalsifiable. Idempotent: a badge is written once per
/// (member, code, season, period) and a re-run inserts nothing new. Mirrors <see cref="XpService"/>.
/// Definitions live in the BadgeDefinitions table (admin-managed, seeded from <see cref="BadgeCatalog"/>).
/// EarnedAt = the date the metric crossed the badge threshold (match / training date, not when it was
/// logged or derived), so month reports bucket badges correctly. Season attendance badges (Iron Man) have no
/// single crossing event and keep the derivation-run time.
/// </summary>
public class BadgeService(FloorballTrainingContext context)
{
    /// <summary>Metrics that accumulate over time, so "every further multiple of the threshold" is meaningful.</summary>
    public static bool IsCumulative(BadgeMetric m) =>
        m is not (BadgeMetric.MaxGoalsInMatch or BadgeMetric.SeasonsPlayed or BadgeMetric.SeasonAttendancePct);

    /// <summary>Copies the built-in <see cref="BadgeCatalog"/> into the table the first time it is empty.
    /// Removing a badge only deactivates it, so the table never goes empty again afterwards.</summary>
    public static async Task EnsureSeededAsync(FloorballTrainingContext ctx, CancellationToken ct = default)
    {
        if (await ctx.BadgeDefinitions.AnyAsync(ct)) return;
        ctx.BadgeDefinitions.AddRange(BadgeCatalog.All.Select(d => new BadgeDefinition
        {
            Code = d.Code.ToString(), Metric = d.Metric, Threshold = d.Threshold, IconPath = d.Icon,
            Period = d.Metric == BadgeMetric.SeasonAttendancePct ? BadgePeriod.Season : BadgePeriod.Lifetime,
        }));
        await ctx.SaveChangesAsync(ct);
    }

    /// <summary>Recompute every member's badges. Returns the number of newly awarded badges.</summary>
    public async Task<int> RecomputeAllAsync(CancellationToken ct = default)
    {
        await EnsureSeededAsync(context, ct);
        var defs = await context.BadgeDefinitions.AsNoTracking().Where(d => d.IsActive).ToListAsync(ct);
        var stats = await ComputeStatsAsync(ct);

        var byKey = (await context.MemberBadges.ToListAsync(ct))
            .ToDictionary(b => (b.MemberId, b.Code, b.SeasonId, b.PeriodKey));
        var toAdd = new List<MemberBadge>();

        void Award(int mid, string code, int? sid, string? periodKey, DateTime? when)
        {
            if (byKey.TryGetValue((mid, code, sid, periodKey), out var old))
            {
                if (when != null && old.EarnedAt != when.Value) old.EarnedAt = when.Value; // back-date run-time stamps
                return;
            }
            var badge = new MemberBadge { MemberId = mid, Code = code, SeasonId = sid, PeriodKey = periodKey };
            if (when != null) badge.EarnedAt = when.Value;
            byKey[(mid, code, sid, periodKey)] = badge;
            toAdd.Add(badge);
        }

        foreach (var s in stats.Values)
        {
            foreach (var def in defs)
            {
                var threshold = Math.Max(1, def.Threshold);
                if (def.Metric == BadgeMetric.SeasonAttendancePct)
                {
                    foreach (var (seasonId, pct) in s.SeasonAttendancePct)
                        if (pct >= threshold) Award(s.MemberId, def.Code, seasonId, null, null);
                }
                else if (def.Period == BadgePeriod.Lifetime)
                {
                    var value = s.Value(def.Metric);
                    var times = def.Repeatable && IsCumulative(def.Metric) ? value / threshold : value >= threshold ? 1 : 0;
                    for (var n = 1; n <= times; n++)
                        Award(s.MemberId, def.Code, null, n == 1 ? null : $"x{n}", s.CrossedAt(def.Metric, threshold * n));
                }
                else
                {
                    foreach (var p in s.Periods(def.Metric, threshold, def.Period))
                        Award(s.MemberId, def.Code, p.SeasonId, p.Key, p.Crossed);
                }
            }
        }

        context.MemberBadges.AddRange(toAdd);
        await context.SaveChangesAsync(ct); // also persists back-dated EarnedAt
        return toAdd.Count;
    }

    /// <summary>Earned + in-progress badges for one member (#97 endpoint).</summary>
    public async Task<List<BadgeStatusDto>> GetBadgesAsync(int memberId, CancellationToken ct = default)
    {
        await EnsureSeededAsync(context, ct);
        var defs = await context.BadgeDefinitions.AsNoTracking().Where(d => d.IsActive).ToListAsync(ct);
        var earned = await context.MemberBadges.AsNoTracking()
            .Where(b => b.MemberId == memberId)
            .Select(b => new { b.Code, b.EarnedAt, b.SeasonId, b.PeriodKey })
            .ToListAsync(ct);

        // Per-badge count of players who share a team with this member and hold it (member included).
        // ponytail: one join, no Member.IsActive filter on peers — a retired teammate keeping a badge
        // barely moves the number; add the filter only if it ever misleads.
        var holdersByCode = (await (
                from myTm in context.TeamMembers.AsNoTracking()
                where myTm.MemberId == memberId && myTm.IsPlayer && myTm.TeamId != null
                join peerTm in context.TeamMembers.AsNoTracking() on myTm.TeamId equals peerTm.TeamId
                where peerTm.IsPlayer
                join badge in context.MemberBadges.AsNoTracking() on peerTm.MemberId equals badge.MemberId
                select new { badge.Code, badge.MemberId })
            .Distinct()
            .GroupBy(x => x.Code)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync(ct))
            .ToDictionary(x => x.Key, x => x.Count);

        var stats = (await ComputeStatsAsync(ct, memberId)).GetValueOrDefault(memberId)
                    ?? new MemberStats { MemberId = memberId };
        var now = DateTime.UtcNow;
        var nowMonth = now.ToString("yyyy-MM");
        var nowSeason = stats.SeasonOf(now);

        return defs.Select(def =>
        {
            var rows = earned.Where(e => e.Code == def.Code).ToList();
            var count = rows.Count;
            var threshold = Math.Max(1, def.Threshold);
            var target = threshold;
            int current;
            double progress;
            if (def.Metric == BadgeMetric.SeasonAttendancePct)
            {
                current = (int)stats.SeasonAttendancePct.Values.DefaultIfEmpty(0).Max();
                progress = count > 0 ? 1.0 : Math.Min(1.0, current / (double)threshold);
            }
            else if (def.Period == BadgePeriod.Lifetime)
            {
                current = stats.Value(def.Metric);
                if (def.Repeatable && IsCumulative(def.Metric))
                {
                    target = threshold * (count + 1); // progress toward the NEXT multiple
                    progress = Math.Clamp((current - threshold * count) / (double)threshold, 0, 1);
                }
                else progress = count > 0 ? 1.0 : Math.Min(1.0, current / (double)threshold);
            }
            else
            {
                current = stats.PeriodValue(def.Metric, def.Period, nowMonth, nowSeason);
                var doneNow = rows.Any(r => def.Period == BadgePeriod.Month ? r.PeriodKey == nowMonth : r.SeasonId == nowSeason);
                progress = doneNow ? 1.0 : Math.Min(1.0, current / (double)threshold);
            }
            return new BadgeStatusDto
            {
                Code = def.Code,
                Icon = def.IconPath,
                Name = def.Name,
                Description = def.Description,
                Period = def.Period.ToString(),
                Repeatable = def.Repeatable,
                Count = count,
                Threshold = target,
                Current = current,
                Earned = count > 0,
                EarnedAt = count > 0 ? rows.Min(r => (DateTime?)r.EarnedAt) : null,
                Progress = progress,
                TeamHolders = holdersByCode.GetValueOrDefault(def.Code, 0)
            };
        }).ToList();
    }

    private class MemberStats
    {
        public int MemberId { get; init; }
        /// <summary>Maps a date to the member's club season (set by <c>ComputeStatsAsync</c>).</summary>
        public Func<DateTime, int?> SeasonOf { get; init; } = _ => null;
        public int TrainingCount;
        public int GoalCount;
        public int AssistCount;
        public int MaxGoalsInMatch;
        public int SeasonsPlayed;
        public readonly Dictionary<int, double> SeasonAttendancePct = new();

        // Career expansion (10-season plan) — added 2026-08-14.
        public int MatchCount;
        public int NetPlusMinus;
        public int HomeTrainingCount;
        public int SkillImprovementCount;
        public int SkillTargetCount;
        public int TestRecordCount;
        public int PlayerOfTrainingCount;
        public int PlayerOfMatchCount;
        public int FairPlayCount;
        public int FamilyCheeredCount;
        public int ChallengeCount;
        public int CareerXp;

        // Dated increments per metric → the date a threshold was crossed (lifetime or within one period).
        private readonly Dictionary<BadgeMetric, List<(DateTime When, int Amount)>> _timeline = new();
        public void Track(BadgeMetric m, DateTime when, int amount = 1) =>
            (_timeline.TryGetValue(m, out var l) ? l : _timeline[m] = new()).Add((when, amount));

        private static DateTime? Crossed(BadgeMetric m, IEnumerable<(DateTime When, int Amount)> l, int threshold)
        {
            if (m == BadgeMetric.MaxGoalsInMatch) // single-match peak, not cumulative
                return l.Where(x => x.Amount >= threshold).Select(x => (DateTime?)x.When).Min();
            var sum = 0;
            foreach (var (when, amount) in l.OrderBy(x => x.When))
                if ((sum += amount) >= threshold) return when;
            return null;
        }

        /// <summary>First date the metric reached <paramref name="threshold"/>; null if no dated source.</summary>
        public DateTime? CrossedAt(BadgeMetric m, int threshold) =>
            _timeline.TryGetValue(m, out var l) ? Crossed(m, l, threshold) : null;

        private IEnumerable<(DateTime When, int Amount)> InPeriod(BadgeMetric m, BadgePeriod p, string? month, int? season) =>
            !_timeline.TryGetValue(m, out var l) ? []
            : p == BadgePeriod.Month ? l.Where(x => x.When.ToString("yyyy-MM") == month)
            : l.Where(x => season != null && SeasonOf(x.When) == season);

        /// <summary>Metric value inside one month / season (peak for single-match metrics).</summary>
        public int PeriodValue(BadgeMetric m, BadgePeriod p, string? month, int? season)
        {
            var items = InPeriod(m, p, month, season).ToList();
            return items.Count == 0 ? 0 : m == BadgeMetric.MaxGoalsInMatch ? items.Max(x => x.Amount) : items.Sum(x => x.Amount);
        }

        /// <summary>Every month / season in which the metric reached <paramref name="threshold"/>.</summary>
        public IEnumerable<(int? SeasonId, string? Key, DateTime? Crossed)> Periods(BadgeMetric m, int threshold, BadgePeriod p)
        {
            if (!_timeline.TryGetValue(m, out var l)) yield break;
            var groups = p == BadgePeriod.Month
                ? l.GroupBy(x => (SeasonId: (int?)null, Key: (string?)x.When.ToString("yyyy-MM")))
                : l.Where(x => SeasonOf(x.When) != null).GroupBy(x => (SeasonId: SeasonOf(x.When), Key: (string?)null));
            foreach (var g in groups)
            {
                var crossed = Crossed(m, g, threshold);
                if (crossed != null) yield return (g.Key.SeasonId, g.Key.Key, crossed);
            }
        }

        public int Value(BadgeMetric m) => m switch
        {
            BadgeMetric.TrainingCount => TrainingCount,
            BadgeMetric.GoalCount => GoalCount,
            BadgeMetric.AssistCount => AssistCount,
            BadgeMetric.MaxGoalsInMatch => MaxGoalsInMatch,
            BadgeMetric.SeasonsPlayed => SeasonsPlayed,
            BadgeMetric.MatchCount => MatchCount,
            BadgeMetric.GoalsPlusAssists => GoalCount + AssistCount,
            BadgeMetric.NetPlusMinus => NetPlusMinus,
            BadgeMetric.HomeTrainingCount => HomeTrainingCount,
            BadgeMetric.SkillImprovementCount => SkillImprovementCount,
            BadgeMetric.SkillTargetCount => SkillTargetCount,
            BadgeMetric.TestRecordCount => TestRecordCount,
            BadgeMetric.PlayerOfTrainingCount => PlayerOfTrainingCount,
            BadgeMetric.PlayerOfMatchCount => PlayerOfMatchCount,
            BadgeMetric.FairPlayCount => FairPlayCount,
            BadgeMetric.FamilyCheeredCount => FamilyCheeredCount,
            BadgeMetric.ChallengeCount => ChallengeCount,
            BadgeMetric.CareerXp => CareerXp,
            _ => 0
        };
    }

    /// <summary>Per-member aggregates that feed the catalog. Scoped to one member when <paramref name="memberId"/> is set.</summary>
    private async Task<Dictionary<int, MemberStats>> ComputeStatsAsync(CancellationToken ct, int? memberId = null)
    {
        // Season resolution (same approach as XpService): map a date to the member's club season.
        var memberClub = await context.Members.AsNoTracking()
            .Where(m => memberId == null || m.Id == memberId)
            .ToDictionaryAsync(m => m.Id, m => m.ClubId, ct);
        var seasonsByClub = (await context.Seasons.AsNoTracking().ToListAsync(ct))
            .Where(s => s.ClubId != null)
            .GroupBy(s => s.ClubId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        int? ResolveSeason(int mid, DateTime date)
        {
            if (!memberClub.TryGetValue(mid, out var clubId) ||
                !seasonsByClub.TryGetValue(clubId, out var seasons)) return null;
            return seasons.FirstOrDefault(s => s.StartDate <= date && (s.EndDate == default || s.EndDate >= date))?.Id;
        }

        var stats = new Dictionary<int, MemberStats>();
        MemberStats Get(int mid) => stats.TryGetValue(mid, out var s) ? s : stats[mid] = new MemberStats { MemberId = mid, SeasonOf = d => ResolveSeason(mid, d) };

        // --- Attendance: training count, seasons played, per-season attendance % (Iron Man) ---
        var attendances = await context.AppointmentAttendances.AsNoTracking()
            .Where(a => memberId == null || a.MemberId == memberId)
            .Include(a => a.Appointment)
            .ToListAsync(ct);

        // SeasonAttendancePct (Iron Man badge) counts trainings only — matches track participation
        // via the lineup/nomination, not attendance. SeasonsPlayed stays based on any presence.
        var seasonTotals = new Dictionary<(int mid, int sid), (int total, int present)>();
        var seasonsPlayed = new Dictionary<int, HashSet<int>>();
        foreach (var a in attendances)
        {
            var present = a.Status == 1;
            var appt = a.Appointment;
            var when = appt?.Start ?? a.RecordedAt;
            var isTraining = appt?.AppointmentType == AppointmentType.Training;

            if (present && isTraining)
            {
                Get(a.MemberId).TrainingCount++;
                Get(a.MemberId).Track(BadgeMetric.TrainingCount, when);
            }

            var sid = ResolveSeason(a.MemberId, when);
            if (sid != null)
            {
                if (present)
                    (seasonsPlayed.TryGetValue(a.MemberId, out var set) ? set : seasonsPlayed[a.MemberId] = new()).Add(sid.Value);

                if (isTraining)
                {
                    var key = (a.MemberId, sid.Value);
                    var cur = seasonTotals.GetValueOrDefault(key);
                    seasonTotals[key] = (cur.total + 1, cur.present + (present ? 1 : 0));
                }
            }
        }

        // MatchCount: a match counts when the member is an available player in the match's lineup
        // (matches don't track attendance). One count per member per match even with several lineups.
        var lineupMatches = (await context.LineupRosters.AsNoTracking()
            .Where(r => r.MemberId != null && r.IsAvailable && (memberId == null || r.MemberId == memberId))
            .Where(r => r.MatchLineup!.Appointment != null && r.MatchLineup.Appointment.AppointmentType == AppointmentType.Match)
            .Select(r => new { MemberId = r.MemberId!.Value, AppointmentId = r.MatchLineup!.AppointmentId!.Value, r.MatchLineup.Appointment!.Start })
            .ToListAsync(ct))
            .DistinctBy(r => (r.MemberId, r.AppointmentId));
        foreach (var m in lineupMatches)
        {
            Get(m.MemberId).MatchCount++;
            Get(m.MemberId).Track(BadgeMetric.MatchCount, m.Start);
            var msid = ResolveSeason(m.MemberId, m.Start);
            if (msid != null)
                (seasonsPlayed.TryGetValue(m.MemberId, out var mset) ? mset : seasonsPlayed[m.MemberId] = new()).Add(msid.Value);
        }

        foreach (var ((mid, sid), (total, present)) in seasonTotals)
        {
            if (total >= BadgeCatalog.IronManMinAppointments)
                Get(mid).SeasonAttendancePct[sid] = present * 100.0 / total;
        }
        foreach (var (mid, set) in seasonsPlayed) Get(mid).SeasonsPlayed = set.Count;

        // --- Match stats: net goals, assists & plus/minus, plus best single-match goal tally (hattrick) ---
        var statEntries = await context.StatTrackerEntries.AsNoTracking()
            .Where(e => e.Kind == 0 && e.StatTrackerParticipantId != null && e.StatTrackerMetricId != null)
            .Where(e => e.Metric!.Code == "goals" || e.Metric.Code == "assists"
                        || e.Metric.Code == "plus" || e.Metric.Code == "minus")
            .Where(e => memberId == null || e.Participant!.MemberId == memberId)
            .Include(e => e.Metric)
            .Include(e => e.Participant)
            .Include(e => e.StatTracker).ThenInclude(t => t!.Appointment)
            .ToListAsync(ct);

        var goalsPerMatch = new Dictionary<(int mid, int tracker), (int Goals, DateTime When)>();
        foreach (var e in statEntries)
        {
            var mid = e.Participant?.MemberId;
            if (mid == null) continue;
            var s = Get(mid.Value);
            var when = e.StatTracker?.Appointment?.Start ?? e.StatTracker?.CreatedAt ?? e.CreatedAt;
            switch (e.Metric!.Code)
            {
                case "goals":
                    s.GoalCount += e.Delta;
                    s.Track(BadgeMetric.GoalCount, when, e.Delta);
                    s.Track(BadgeMetric.GoalsPlusAssists, when, e.Delta);
                    var key = (mid.Value, e.StatTrackerId);
                    goalsPerMatch[key] = (goalsPerMatch.GetValueOrDefault(key).Goals + e.Delta, when);
                    break;
                case "assists":
                    s.AssistCount += e.Delta;
                    s.Track(BadgeMetric.AssistCount, when, e.Delta);
                    s.Track(BadgeMetric.GoalsPlusAssists, when, e.Delta);
                    break;
                case "plus":
                    s.NetPlusMinus += e.Delta;
                    s.Track(BadgeMetric.NetPlusMinus, when, e.Delta);
                    break;
                case "minus":
                    s.NetPlusMinus -= e.Delta;
                    s.Track(BadgeMetric.NetPlusMinus, when, -e.Delta);
                    break;
            }
        }
        foreach (var ((mid, _), (goals, when)) in goalsPerMatch)
        {
            var s = Get(mid);
            s.MaxGoalsInMatch = Math.Max(s.MaxGoalsInMatch, goals);
            s.Track(BadgeMetric.MaxGoalsInMatch, when, goals);
        }

        // --- Career expansion (10-season plan): counts derived from the XP ledger (XpEvent), which is
        // itself already derived from these same coach-entered records (home training, skill progress,
        // tests, coach awards, challenges) and runs earlier in GamificationRecomputeJob. Count() — not
        // Sum(Points) — so a club/team's configurable XP rate never affects whether a badge is earned.
        // ponytail: CareerXp sums every event's raw Points (uncapped) as a "good enough" milestone value —
        // simpler than replicating XpService's home-training cap split; upgrade only if a badge fires
        // visibly ahead of the displayed rank/level because of it.
        var xpEvents = await context.XpEvents.AsNoTracking()
            .Where(e => memberId == null || e.MemberId == memberId)
            .Select(e => new { e.MemberId, e.Type, e.Points, e.OccurredAt })
            .ToListAsync(ct);
        foreach (var group in xpEvents.GroupBy(e => e.MemberId))
        {
            var s = Get(group.Key);
            s.CareerXp = group.Sum(e => e.Points);
            foreach (var e in group) s.Track(BadgeMetric.CareerXp, e.OccurredAt, e.Points);
            foreach (var byType in group.GroupBy(e => e.Type))
            {
                var count = byType.Count();
                BadgeMetric? metric = null;
                switch (byType.Key)
                {
                    case XpEventType.HomeTraining: s.HomeTrainingCount = count; metric = BadgeMetric.HomeTrainingCount; break;
                    case XpEventType.SkillGradeImprovement: s.SkillImprovementCount = count; metric = BadgeMetric.SkillImprovementCount; break;
                    case XpEventType.SkillTargetReached: s.SkillTargetCount = count; metric = BadgeMetric.SkillTargetCount; break;
                    case XpEventType.TestPersonalRecord: s.TestRecordCount = count; metric = BadgeMetric.TestRecordCount; break;
                    case XpEventType.PlayerOfTraining: s.PlayerOfTrainingCount = count; metric = BadgeMetric.PlayerOfTrainingCount; break;
                    case XpEventType.PlayerOfMatch: s.PlayerOfMatchCount = count; metric = BadgeMetric.PlayerOfMatchCount; break;
                    case XpEventType.FairPlay: s.FairPlayCount = count; metric = BadgeMetric.FairPlayCount; break;
                    case XpEventType.FamilyCheered: s.FamilyCheeredCount = count; metric = BadgeMetric.FamilyCheeredCount; break;
                }
                if (metric != null)
                    foreach (var e in byType) s.Track(metric.Value, e.OccurredAt);
            }
        }

        // Challenges pay no XP (they're trophies), so count the completions themselves, not XpEvents.
        var completions = await context.ChallengeCompletions.AsNoTracking()
            .Where(c => memberId == null || c.MemberId == memberId)
            .Select(c => new { c.MemberId, c.CompletedAt })
            .ToListAsync(ct);
        foreach (var c in completions)
        {
            var s = Get(c.MemberId);
            s.ChallengeCount++;
            s.Track(BadgeMetric.ChallengeCount, c.CompletedAt);
        }

        return stats;
    }
}
