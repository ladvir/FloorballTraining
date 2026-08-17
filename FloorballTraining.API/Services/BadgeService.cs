using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Derives collectible milestone badges (#97) from the same coach-entered records as XP — attendance,
/// match stats and seasons — so they are unfalsifiable. Idempotent: a badge is written once per
/// (member, code, season) and a re-run inserts nothing new. Mirrors <see cref="XpService"/>.
/// ponytail: EarnedAt = derivation-run time (stable after first award), not the exact crossing date.
/// Recompute the crossing date only if a badge timeline is ever needed.
/// </summary>
public class BadgeService(FloorballTrainingContext context)
{
    /// <summary>Recompute every member's badges. Returns the number of newly awarded badges.</summary>
    public async Task<int> RecomputeAllAsync(CancellationToken ct = default)
    {
        var stats = await ComputeStatsAsync(ct);

        var existing = (await context.MemberBadges
                .Select(b => new { b.MemberId, b.Code, b.SeasonId })
                .ToListAsync(ct))
            .Select(b => (b.MemberId, b.Code, b.SeasonId))
            .ToHashSet();

        var toAdd = new List<MemberBadge>();
        foreach (var s in stats.Values)
        {
            foreach (var def in BadgeCatalog.All)
            {
                if (def.Metric == BadgeMetric.SeasonAttendancePct)
                {
                    foreach (var (seasonId, pct) in s.SeasonAttendancePct)
                        if (pct >= def.Threshold && existing.Add((s.MemberId, def.Code, seasonId)))
                            toAdd.Add(new MemberBadge { MemberId = s.MemberId, Code = def.Code, SeasonId = seasonId });
                }
                else if (s.Value(def.Metric) >= def.Threshold && existing.Add((s.MemberId, def.Code, (int?)null)))
                {
                    toAdd.Add(new MemberBadge { MemberId = s.MemberId, Code = def.Code });
                }
            }
        }

        if (toAdd.Count > 0)
        {
            context.MemberBadges.AddRange(toAdd);
            await context.SaveChangesAsync(ct);
        }
        return toAdd.Count;
    }

    /// <summary>Earned + in-progress badges for one member (#97 endpoint).</summary>
    public async Task<List<BadgeStatusDto>> GetBadgesAsync(int memberId, CancellationToken ct = default)
    {
        var earned = await context.MemberBadges.AsNoTracking()
            .Where(b => b.MemberId == memberId)
            .Select(b => new { b.Code, b.EarnedAt })
            .ToListAsync(ct);

        var stats = (await ComputeStatsAsync(ct, memberId)).GetValueOrDefault(memberId)
                    ?? new MemberStats { MemberId = memberId };

        return BadgeCatalog.All.Select(def =>
        {
            var earnedAt = earned.Where(e => e.Code == def.Code).Select(e => (DateTime?)e.EarnedAt).Min();
            var current = def.Metric == BadgeMetric.SeasonAttendancePct
                ? (int)(stats.SeasonAttendancePct.Values.DefaultIfEmpty(0).Max())
                : stats.Value(def.Metric);
            return new BadgeStatusDto
            {
                Code = def.Code.ToString(),
                Icon = def.Icon,
                Threshold = def.Threshold,
                Current = current,
                Earned = earnedAt != null,
                EarnedAt = earnedAt,
                Progress = earnedAt != null ? 1.0
                    : Math.Min(1.0, def.Threshold == 0 ? 1 : current / (double)def.Threshold)
            };
        }).ToList();
    }

    private class MemberStats
    {
        public int MemberId { get; init; }
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
        public int FairPlayCount;
        public int FamilyCheeredCount;
        public int ChallengeCount;
        public int CareerXp;

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
        MemberStats Get(int mid) => stats.TryGetValue(mid, out var s) ? s : stats[mid] = new MemberStats { MemberId = mid };

        // --- Attendance: training count, seasons played, per-season attendance % (Iron Man) ---
        var attendances = await context.AppointmentAttendances.AsNoTracking()
            .Where(a => memberId == null || a.MemberId == memberId)
            .Include(a => a.Appointment)
            .ToListAsync(ct);

        var seasonTotals = new Dictionary<(int mid, int sid), (int total, int present)>();
        foreach (var a in attendances)
        {
            var present = a.Status == 1;
            var appt = a.Appointment;
            var when = appt?.Start ?? a.RecordedAt;

            if (present && appt?.AppointmentType == AppointmentType.Training)
                Get(a.MemberId).TrainingCount++;
            else if (present && appt?.AppointmentType == AppointmentType.Match)
                Get(a.MemberId).MatchCount++;

            var sid = ResolveSeason(a.MemberId, when);
            if (sid != null)
            {
                var key = (a.MemberId, sid.Value);
                var cur = seasonTotals.GetValueOrDefault(key);
                seasonTotals[key] = (cur.total + 1, cur.present + (present ? 1 : 0));
            }
        }

        var seasonsPlayed = new Dictionary<int, HashSet<int>>();
        foreach (var ((mid, sid), (total, present)) in seasonTotals)
        {
            if (present > 0)
                (seasonsPlayed.TryGetValue(mid, out var set) ? set : seasonsPlayed[mid] = new()).Add(sid);
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
            .ToListAsync(ct);

        var goalsPerMatch = new Dictionary<(int mid, int tracker), int>();
        foreach (var e in statEntries)
        {
            var mid = e.Participant?.MemberId;
            if (mid == null) continue;
            var s = Get(mid.Value);
            switch (e.Metric!.Code)
            {
                case "goals":
                    s.GoalCount += e.Delta;
                    var key = (mid.Value, e.StatTrackerId);
                    goalsPerMatch[key] = goalsPerMatch.GetValueOrDefault(key) + e.Delta;
                    break;
                case "assists":
                    s.AssistCount += e.Delta;
                    break;
                case "plus":
                    s.NetPlusMinus += e.Delta;
                    break;
                case "minus":
                    s.NetPlusMinus -= e.Delta;
                    break;
            }
        }
        foreach (var ((mid, _), goals) in goalsPerMatch)
        {
            var s = Get(mid);
            s.MaxGoalsInMatch = Math.Max(s.MaxGoalsInMatch, goals);
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
            .Select(e => new { e.MemberId, e.Type, e.Points })
            .ToListAsync(ct);
        foreach (var group in xpEvents.GroupBy(e => e.MemberId))
        {
            var s = Get(group.Key);
            s.CareerXp = group.Sum(e => e.Points);
            foreach (var byType in group.GroupBy(e => e.Type))
            {
                var count = byType.Count();
                switch (byType.Key)
                {
                    case XpEventType.HomeTraining: s.HomeTrainingCount = count; break;
                    case XpEventType.SkillGradeImprovement: s.SkillImprovementCount = count; break;
                    case XpEventType.SkillTargetReached: s.SkillTargetCount = count; break;
                    case XpEventType.TestPersonalRecord: s.TestRecordCount = count; break;
                    case XpEventType.PlayerOfTraining: s.PlayerOfTrainingCount = count; break;
                    case XpEventType.FairPlay: s.FairPlayCount = count; break;
                    case XpEventType.FamilyCheered: s.FamilyCheeredCount = count; break;
                    case XpEventType.ChallengeReward: s.ChallengeCount = count; break;
                }
            }
        }

        return stats;
    }
}
