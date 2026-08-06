using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Derives the append-only XP ledger (layer A) from coach-entered records: attendance, match stats,
/// skill-grade progress and test personal records. Idempotent — every source record yields its XP
/// exactly once, keyed by (Type, SourceKind, SourceId), so a re-run never duplicates.
/// ponytail: full-history rescan per run (MVP batch). Add incremental hooks on record write if the
/// scan gets slow.
/// </summary>
public class XpService(FloorballTrainingContext context)
{
    /// <summary>
    /// Recompute the whole ledger. Returns the number of XP events written (inserts + re-priced updates).
    /// Point values follow the club/team overrides (#106) with fallback to <see cref="XpRules"/>, so
    /// changing a rate re-prices already-persisted events, not just newly inserted ones.
    /// </summary>
    public async Task<int> RecomputeAllAsync(CancellationToken ct = default)
    {
        var existingEvents = await context.XpEvents
            .Select(e => new { e.Id, e.Type, e.SourceKind, e.SourceId, e.Points })
            .ToListAsync(ct);
        var persisted = existingEvents
            .Select(e => (e.Type, e.SourceKind, e.SourceId))
            .ToHashSet();
        // (Type, SourceKind, SourceId) is a unique index → one existing row per key.
        var persistedById = existingEvents
            .ToDictionary(e => (e.Type, e.SourceKind, e.SourceId), e => (e.Id, e.Points));

        var memberClub = await context.Members.AsNoTracking()
            .ToDictionaryAsync(m => m.Id, m => m.ClubId, ct);
        var seasonsByClub = (await context.Seasons.AsNoTracking().ToListAsync(ct))
            .Where(s => s.ClubId != null)
            .GroupBy(s => s.ClubId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Club/team point overrides (#106). Resolution when pricing an event: team row → club row → default.
        var overrides = await context.XpRuleConfigs.AsNoTracking()
            .ToDictionaryAsync(c => (c.ClubId, c.TeamId, c.EventType), c => c.Points, ct);
        int PointsFor(int clubId, int? teamId, XpEventType type)
        {
            if (teamId != null && overrides.TryGetValue((clubId, teamId, type), out var teamPts)) return teamPts;
            if (overrides.TryGetValue((clubId, (int?)null, type), out var clubPts)) return clubPts;
            return XpRules.PointsFor(type);
        }

        int? ResolveSeason(int memberId, DateTime date)
        {
            if (!memberClub.TryGetValue(memberId, out var clubId) ||
                !seasonsByClub.TryGetValue(clubId, out var seasons)) return null;
            return seasons.FirstOrDefault(s => s.StartDate <= date && (s.EndDate == default || s.EndDate >= date))?.Id;
        }

        // Every (Type, SourceKind, SourceId) the current source data should produce this run.
        var desired = new HashSet<(XpEventType, XpSourceKind, int?)>();
        var toAdd = new List<XpEvent>();
        var toUpdate = new List<(int Id, int Points)>(); // existing events whose price changed (re-pricing)
        // `units` is the count/sign (1 for flat events, ±Delta for stats); the money value is units ×
        // the resolved per-club/team rate, so a rate change re-prices every event of that type here.
        void Add(int memberId, XpEventType type, int units, int? teamId, XpSourceKind kind, int sourceId, DateTime occurredAt)
        {
            var key = (type, kind, (int?)sourceId);
            if (!desired.Add(key)) return; // this source produces the key once per run
            var clubId = memberClub.GetValueOrDefault(memberId);
            var points = units * PointsFor(clubId, teamId, type);
            if (persistedById.TryGetValue(key, out var existing))
            {
                if (existing.Points != points) toUpdate.Add((existing.Id, points)); // re-price in place
                return;
            }
            toAdd.Add(new XpEvent
            {
                MemberId = memberId,
                Type = type,
                Points = points,
                SeasonId = ResolveSeason(memberId, occurredAt),
                SourceKind = kind,
                SourceId = sourceId,
                OccurredAt = occurredAt,
            });
        }

        DeriveAttendance(await LoadAttendanceAsync(ct), Add);
        DeriveStats(await LoadStatEntriesAsync(ct), Add);
        DeriveSkillProgress(await LoadRatingsAsync(ct), Add);
        DeriveTestRecords(await LoadTestResultsAsync(ct), Add);
        var coachAwards = await LoadCoachAwardsAsync(ct);
        DeriveCoachAwards(coachAwards, Add);
        DeriveFamilySupport(coachAwards, await LoadFanCheckInsAsync(ct), Add);
        DeriveHomeTraining(await LoadHomeTrainingLogsAsync(ct), Add);

        // Prune orphans: an existing event whose SourceKind this derivation owns but whose source no
        // longer produces it — the record was deleted or downgraded (e.g. attendance Present -> Absent).
        // Scoped to owned kinds so events from other layers (coach awards, home training, …) are left alone.
        var ownedKinds = new[]
        {
            XpSourceKind.Attendance, XpSourceKind.StatTrackerEntry,
            XpSourceKind.SkillRating, XpSourceKind.TestResult, XpSourceKind.CoachAward, XpSourceKind.FanCheckIn,
            XpSourceKind.HomeTraining
        };
        var orphanIds = existingEvents
            .Where(e => ownedKinds.Contains(e.SourceKind) && !desired.Contains((e.Type, e.SourceKind, e.SourceId)))
            .Select(e => e.Id)
            .ToList();
        if (orphanIds.Count > 0)
            await context.XpEvents.Where(e => orphanIds.Contains(e.Id)).ExecuteDeleteAsync(ct);

        // Re-price existing events whose rate changed (#106). Batch by target value: distinct point values
        // are few, so this is a handful of set-based UPDATEs, not one per row.
        foreach (var g in toUpdate.GroupBy(u => u.Points))
        {
            var ids = g.Select(u => u.Id).ToList();
            await context.XpEvents.Where(e => ids.Contains(e.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(e => e.Points, g.Key), ct);
        }

        if (toAdd.Count > 0)
        {
            context.XpEvents.AddRange(toAdd);
            await context.SaveChangesAsync(ct);
        }
        return toAdd.Count + toUpdate.Count;
    }

    private delegate void AddXp(int memberId, XpEventType type, int units, int? teamId, XpSourceKind kind, int sourceId, DateTime occurredAt);

    // --- Attendance (Status=1 Present); Match appointments count as match, everything else as training ---
    private Task<List<AppointmentAttendance>> LoadAttendanceAsync(CancellationToken ct) =>
        context.AppointmentAttendances.AsNoTracking()
            .Where(a => a.Status == 1)
            .Include(a => a.Appointment)
            .ToListAsync(ct);

    private static void DeriveAttendance(List<AppointmentAttendance> attendances, AddXp add)
    {
        foreach (var a in attendances)
        {
            var isMatch = a.Appointment?.AppointmentType == AppointmentType.Match;
            var type = isMatch ? XpEventType.MatchAttendance : XpEventType.TrainingAttendance;
            var when = a.Appointment?.Start ?? a.RecordedAt;
            add(a.MemberId, type, 1, a.Appointment?.TeamId, XpSourceKind.Attendance, a.Id, when);
        }
    }

    // --- Match stats: goals / assists / plus-minus from the StatTracker undo-log (Delta signed) ---
    private Task<List<StatTrackerEntry>> LoadStatEntriesAsync(CancellationToken ct) =>
        context.StatTrackerEntries.AsNoTracking()
            .Where(e => e.Kind == 0 && e.StatTrackerParticipantId != null && e.StatTrackerMetricId != null)
            .Include(e => e.Metric)
            .Include(e => e.Participant)
            .Include(e => e.StatTracker)
            .ToListAsync(ct);

    private static void DeriveStats(List<StatTrackerEntry> entries, AddXp add)
    {
        foreach (var e in entries)
        {
            var memberId = e.Participant?.MemberId;
            if (memberId == null) continue;

            // Type + signed units (× the resolved rate in Add); a -1 undo entry cancels its earlier +1.
            (XpEventType type, int units)? mapped = e.Metric?.Code switch
            {
                "goals" => (XpEventType.Goal, e.Delta),
                "assists" => (XpEventType.Assist, e.Delta),
                "plus" => (XpEventType.PlusMinus, e.Delta),
                "minus" => (XpEventType.PlusMinus, -e.Delta),
                _ => null
            };
            if (mapped == null) continue;

            add(memberId.Value, mapped.Value.type, mapped.Value.units, e.StatTracker?.TeamId, XpSourceKind.StatTrackerEntry, e.Id, e.CreatedAt);
        }
    }

    // --- Skill grade: improvement over the previous rating; bonus the first time a target is reached ---
    private Task<List<PlayerSkillRating>> LoadRatingsAsync(CancellationToken ct) =>
        context.PlayerSkillRatings.AsNoTracking()
            .OrderBy(r => r.MemberId).ThenBy(r => r.SkillId).ThenBy(r => r.RatedAt).ThenBy(r => r.Id)
            .ToListAsync(ct);

    private static void DeriveSkillProgress(List<PlayerSkillRating> ratings, AddXp add)
    {
        foreach (var group in ratings.GroupBy(r => new { r.MemberId, r.SkillId }))
        {
            int? prevGrade = null;   // immediately preceding rating
            int? bestGrade = null;   // best (lowest number) seen so far
            foreach (var r in group)
            {
                // Skill events are member level (no source team) → priced at club scope only.
                if (prevGrade != null && r.Grade < prevGrade) // grade 1 = best, lower is better
                    add(r.MemberId, XpEventType.SkillGradeImprovement, 1, null,
                        XpSourceKind.SkillRating, r.Id, r.RatedAt);

                if (r.TargetGrade is int target && r.Grade <= target && (bestGrade == null || bestGrade > target))
                    add(r.MemberId, XpEventType.SkillTargetReached, 1, null,
                        XpSourceKind.SkillRating, r.Id, r.RatedAt);

                prevGrade = r.Grade;
                bestGrade = bestGrade == null ? r.Grade : Math.Min(bestGrade.Value, r.Grade);
            }
        }
    }

    // --- Test personal record: a numeric result that beats the athlete's best prior result of that test ---
    private Task<List<TestResult>> LoadTestResultsAsync(CancellationToken ct) =>
        context.TestResults.AsNoTracking()
            .Where(t => t.NumericValue != null)
            .Include(t => t.TestDefinition)
            .OrderBy(t => t.MemberId).ThenBy(t => t.TestDefinitionId).ThenBy(t => t.TestDate).ThenBy(t => t.Id)
            .ToListAsync(ct);

    private static void DeriveTestRecords(List<TestResult> results, AddXp add)
    {
        foreach (var group in results.GroupBy(t => new { t.MemberId, t.TestDefinitionId }))
        {
            double? best = null;
            foreach (var t in group)
            {
                var value = t.NumericValue!.Value;
                var higherIsBetter = t.TestDefinition?.HigherIsBetter ?? true;
                // Test PRs are member level (no source team) → priced at club scope only.
                if (best != null && (higherIsBetter ? value > best : value < best))
                    add(t.MemberId, XpEventType.TestPersonalRecord, 1, null,
                        XpSourceKind.TestResult, t.Id, t.TestDate);

                best = best == null ? value : (higherIsBetter ? Math.Max(best.Value, value) : Math.Min(best.Value, value));
            }
        }
    }

    // --- Layer B: coach 1-click bonuses (#100). The award row is the approval; occurred-at = appointment start ---
    private Task<List<XpCoachAward>> LoadCoachAwardsAsync(CancellationToken ct) =>
        context.XpCoachAwards.AsNoTracking()
            .Include(a => a.Appointment)
            .ToListAsync(ct);

    private static void DeriveCoachAwards(List<XpCoachAward> awards, AddXp add)
    {
        foreach (var a in awards)
        {
            // FamilyCheered is unified with parent fan check-ins (dedup) in DeriveFamilySupport (#103).
            if (a.Type == AwardType.FamilyCheered) continue;
            var type = XpRules.EventTypeFor(a.Type);
            var when = a.Appointment?.Start ?? a.AwardedAt;
            add(a.MemberId, type, 1, a.Appointment?.TeamId, XpSourceKind.CoachAward, a.Id, when);
        }
    }

    // --- Family support (#103): the child's "family cheered" +5 bonus, from a coach mark OR a parent's
    //     fan check-in — at most ONE per (match, child) across both sources. The coach mark is canonical
    //     when present, else the earliest check-in, so the child never gets the bonus twice for one match.
    private Task<List<FanCheckIn>> LoadFanCheckInsAsync(CancellationToken ct) =>
        context.FanCheckIns.AsNoTracking()
            .Include(f => f.Appointment)
            .ToListAsync(ct);

    private static void DeriveFamilySupport(List<XpCoachAward> awards, List<FanCheckIn> checkIns, AddXp add)
    {
        var canonical = new Dictionary<(int Appt, int Member), (XpSourceKind Kind, int SourceId, DateTime When, int? TeamId)>();
        foreach (var c in checkIns.OrderBy(c => c.Id))
        {
            var key = (c.AppointmentId, c.MemberId);
            if (!canonical.ContainsKey(key))
                canonical[key] = (XpSourceKind.FanCheckIn, c.Id, c.Appointment?.Start ?? c.CheckedInAt, c.Appointment?.TeamId);
        }
        foreach (var a in awards.Where(a => a.Type == AwardType.FamilyCheered))
            canonical[(a.AppointmentId, a.MemberId)] = (XpSourceKind.CoachAward, a.Id, a.Appointment?.Start ?? a.AwardedAt, a.Appointment?.TeamId);

        foreach (var (key, src) in canonical)
            add(key.Member, XpEventType.FamilyCheered, 1, src.TeamId, src.Kind, src.SourceId, src.When);
    }

    // --- Layer C: capped self-report (#104). Only a CONFIRMED, non-rejected home-training log earns XP;
    //     the amount is then capped against non-home XP in GetSummaryAsync (never here — the ledger stays raw).
    private Task<List<HomeTrainingLog>> LoadHomeTrainingLogsAsync(CancellationToken ct) =>
        context.HomeTrainingLogs.AsNoTracking()
            .Where(l => l.ConfirmedAt != null && l.RejectedAt == null)
            .ToListAsync(ct);

    private static void DeriveHomeTraining(List<HomeTrainingLog> logs, AddXp add)
    {
        // Home training is a member-level self-report (no source team) → priced at club scope only.
        foreach (var l in logs)
            add(l.MemberId, XpEventType.HomeTraining, 1, null, XpSourceKind.HomeTraining, l.Id, l.LoggedAt);
    }

    public async Task<XpSummaryDto> GetSummaryAsync(int memberId, CancellationToken ct = default)
    {
        // XP is a player thing (#104): a member with no player role in any team has no XP profile —
        // an empty summary, so nothing shows on the dashboard, member card or anywhere it's read.
        var isPlayer = await context.TeamMembers.AnyAsync(tm => tm.MemberId == memberId && tm.IsPlayer, ct);
        if (!isPlayer)
            return new XpSummaryDto { MemberId = memberId, Career = XpProgression.Career(0) };

        var events = await context.XpEvents.AsNoTracking()
            .Where(e => e.MemberId == memberId)
            .Select(e => new { e.Points, e.SeasonId, e.Type, e.OccurredAt })
            .ToListAsync(ct);

        // Cap self-report (#104): two caps stack. (1) Per day, all home logs together count at most one
        // normal team training (HomeDailyXpCap) — so doing many home sessions in a day can't out-earn a
        // real training. (2) Overall, counted home XP ≤ capPct × non-home XP; nonHome=0 → cap=0, so a pure
        // self-reporter gets nothing toward level/rank/form. Applied to the lifetime total AND each season.
        static (int Total, int RawHome, int CountedHome, int Cap) Split(IReadOnlyList<(int Points, XpEventType Type, DateTime OccurredAt)> evs)
        {
            var nonHome = evs.Where(e => e.Type != XpEventType.HomeTraining).Sum(e => e.Points);
            var homeEvs = evs.Where(e => e.Type == XpEventType.HomeTraining).ToList();
            var rawHome = homeEvs.Sum(e => e.Points);
            var dayCapped = homeEvs.GroupBy(e => e.OccurredAt.Date)
                .Sum(g => Math.Min(g.Sum(e => e.Points), XpRules.HomeDailyXpCap));
            var cap = Math.Max(0, nonHome) * XpRules.HomeXpCapPercent / 100;
            var counted = Math.Min(dayCapped, cap);
            return (nonHome + counted, rawHome, counted, cap);
        }

        var all = events.Select(e => (e.Points, e.Type, e.OccurredAt)).ToList();
        var life = Split(all);

        return new XpSummaryDto
        {
            MemberId = memberId,
            TotalXp = life.Total,
            RawHomeXp = life.RawHome,
            CountedHomeXp = life.CountedHome,
            HomeXpCap = life.Cap,
            Career = XpProgression.Career(life.Total),
            BySeason = events.Where(e => e.SeasonId != null)
                .GroupBy(e => e.SeasonId!.Value)
                .Select(g => new { SeasonId = g.Key, Xp = Split(g.Select(x => (x.Points, x.Type, x.OccurredAt)).ToList()).Total })
                .Select(s => new SeasonXpDto { SeasonId = s.SeasonId, Xp = s.Xp, Stars = XpProgression.Stars(s.Xp) })
                .OrderBy(s => s.SeasonId)
                .ToList(),
            // The breakdown shows COUNTED home XP (what reached the total), not the raw self-reported figure.
            ByType = events.GroupBy(e => e.Type)
                .Select(g => new XpByTypeDto
                {
                    Type = g.Key.ToString(),
                    Xp = g.Key == XpEventType.HomeTraining ? life.CountedHome : g.Sum(x => x.Points)
                })
                .Where(b => b.Xp != 0)
                .OrderByDescending(b => b.Xp)
                .ToList()
        };
    }
}
