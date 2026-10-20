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
/// EarnedAt = the date the metric crossed the badge threshold (match / training date, not when it was
/// logged or derived), so month reports bucket badges correctly. Season-scoped badges (Iron Man) have no
/// single crossing event and keep the derivation-run time.
/// </summary>
public class BadgeService(FloorballTrainingContext context)
{
    /// <summary>Recompute every member's badges. Returns the number of newly awarded badges.</summary>
    public async Task<int> RecomputeAllAsync(CancellationToken ct = default)
    {
        var stats = await ComputeStatsAsync(ct);

        var existingBadges = await context.MemberBadges.ToListAsync(ct);
        var existing = existingBadges.Select(b => (b.MemberId, b.Code, b.SeasonId)).ToHashSet();
        var existingByKey = existingBadges.ToDictionary(b => (b.MemberId, b.Code, b.SeasonId));

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
                else if (s.Value(def.Metric) >= def.Threshold)
                {
                    var crossed = s.CrossedAt(def.Metric, def.Threshold);
                    if (existing.Add((s.MemberId, def.Code, (int?)null)))
                    {
                        var badge = new MemberBadge { MemberId = s.MemberId, Code = def.Code };
                        if (crossed != null) badge.EarnedAt = crossed.Value;
                        toAdd.Add(badge);
                    }
                    else if (crossed != null && existingByKey.TryGetValue((s.MemberId, def.Code, (int?)null), out var old)
                             && old.EarnedAt != crossed.Value)
                    {
                        old.EarnedAt = crossed.Value; // back-date badges stamped with the run time
                    }
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
        var earned = await context.MemberBadges.AsNoTracking()
            .Where(b => b.MemberId == memberId)
            .Select(b => new { b.Code, b.EarnedAt })
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
                    : Math.Min(1.0, def.Threshold == 0 ? 1 : current / (double)def.Threshold),
                TeamHolders = holdersByCode.GetValueOrDefault(def.Code, 0)
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
        public int PlayerOfMatchCount;
        public int FairPlayCount;
        public int FamilyCheeredCount;
        public int ChallengeCount;
        public int CareerXp;

        // Dated increments per metric → the date a threshold was crossed.
        private readonly Dictionary<BadgeMetric, List<(DateTime When, int Amount)>> _timeline = new();
        public void Track(BadgeMetric m, DateTime when, int amount = 1) =>
            (_timeline.TryGetValue(m, out var l) ? l : _timeline[m] = new()).Add((when, amount));

        /// <summary>First date the metric reached <paramref name="threshold"/>; null if no dated source.</summary>
        public DateTime? CrossedAt(BadgeMetric m, int threshold)
        {
            if (!_timeline.TryGetValue(m, out var l)) return null;
            if (m == BadgeMetric.MaxGoalsInMatch) // single-match peak, not cumulative
                return l.Where(x => x.Amount >= threshold).Select(x => (DateTime?)x.When).Min();
            var sum = 0;
            foreach (var (when, amount) in l.OrderBy(x => x.When))
                if ((sum += amount) >= threshold) return when;
            return null;
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
        MemberStats Get(int mid) => stats.TryGetValue(mid, out var s) ? s : stats[mid] = new MemberStats { MemberId = mid };

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
                    case XpEventType.ChallengeReward: s.ChallengeCount = count; metric = BadgeMetric.ChallengeCount; break;
                }
                if (metric != null)
                    foreach (var e in byType) s.Track(metric.Value, e.OccurredAt);
            }
        }

        return stats;
    }
}
