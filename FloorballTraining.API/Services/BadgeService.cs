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

        public int Value(BadgeMetric m) => m switch
        {
            BadgeMetric.TrainingCount => TrainingCount,
            BadgeMetric.GoalCount => GoalCount,
            BadgeMetric.AssistCount => AssistCount,
            BadgeMetric.MaxGoalsInMatch => MaxGoalsInMatch,
            BadgeMetric.SeasonsPlayed => SeasonsPlayed,
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

        // --- Match stats: net goals & assists, plus best single-match goal tally (hattrick) ---
        var statEntries = await context.StatTrackerEntries.AsNoTracking()
            .Where(e => e.Kind == 0 && e.StatTrackerParticipantId != null && e.StatTrackerMetricId != null)
            .Where(e => e.Metric!.Code == "goals" || e.Metric.Code == "assists")
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
            if (e.Metric!.Code == "goals")
            {
                s.GoalCount += e.Delta;
                var key = (mid.Value, e.StatTrackerId);
                goalsPerMatch[key] = goalsPerMatch.GetValueOrDefault(key) + e.Delta;
            }
            else
            {
                s.AssistCount += e.Delta;
            }
        }
        foreach (var ((mid, _), goals) in goalsPerMatch)
        {
            var s = Get(mid);
            s.MaxGoalsInMatch = Math.Max(s.MaxGoalsInMatch, goals);
        }

        return stats;
    }
}
