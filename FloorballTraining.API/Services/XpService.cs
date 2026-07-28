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
    /// <summary>Recompute the whole ledger. Returns the number of newly inserted XP events.</summary>
    public async Task<int> RecomputeAllAsync(CancellationToken ct = default)
    {
        var existingEvents = await context.XpEvents
            .Select(e => new { e.Id, e.Type, e.SourceKind, e.SourceId })
            .ToListAsync(ct);
        var persisted = existingEvents
            .Select(e => (e.Type, e.SourceKind, e.SourceId))
            .ToHashSet();

        var memberClub = await context.Members.AsNoTracking()
            .ToDictionaryAsync(m => m.Id, m => m.ClubId, ct);
        var seasonsByClub = (await context.Seasons.AsNoTracking().ToListAsync(ct))
            .Where(s => s.ClubId != null)
            .GroupBy(s => s.ClubId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        int? ResolveSeason(int memberId, DateTime date)
        {
            if (!memberClub.TryGetValue(memberId, out var clubId) ||
                !seasonsByClub.TryGetValue(clubId, out var seasons)) return null;
            return seasons.FirstOrDefault(s => s.StartDate <= date && (s.EndDate == default || s.EndDate >= date))?.Id;
        }

        // Every (Type, SourceKind, SourceId) the current source data should produce this run.
        var desired = new HashSet<(XpEventType, XpSourceKind, int?)>();
        var toAdd = new List<XpEvent>();
        void Add(int memberId, XpEventType type, int points, XpSourceKind kind, int sourceId, DateTime occurredAt)
        {
            var key = (type, kind, (int?)sourceId);
            if (!desired.Add(key)) return;       // this source produces the key once per run
            if (persisted.Contains(key)) return; // already awarded — keep it as is
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
        DeriveCoachAwards(await LoadCoachAwardsAsync(ct), Add);

        // Prune orphans: an existing event whose SourceKind this derivation owns but whose source no
        // longer produces it — the record was deleted or downgraded (e.g. attendance Present -> Absent).
        // Scoped to owned kinds so events from other layers (coach awards, home training, …) are left alone.
        var ownedKinds = new[]
        {
            XpSourceKind.Attendance, XpSourceKind.StatTrackerEntry,
            XpSourceKind.SkillRating, XpSourceKind.TestResult, XpSourceKind.CoachAward
        };
        var orphanIds = existingEvents
            .Where(e => ownedKinds.Contains(e.SourceKind) && !desired.Contains((e.Type, e.SourceKind, e.SourceId)))
            .Select(e => e.Id)
            .ToList();
        if (orphanIds.Count > 0)
            await context.XpEvents.Where(e => orphanIds.Contains(e.Id)).ExecuteDeleteAsync(ct);

        if (toAdd.Count > 0)
        {
            context.XpEvents.AddRange(toAdd);
            await context.SaveChangesAsync(ct);
        }
        return toAdd.Count;
    }

    private delegate void AddXp(int memberId, XpEventType type, int points, XpSourceKind kind, int sourceId, DateTime occurredAt);

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
            add(a.MemberId, type, XpRules.PointsFor(type), XpSourceKind.Attendance, a.Id, when);
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

            // Type + signed points; a -1 undo entry cancels its earlier +1 (self-correcting).
            (XpEventType type, int points)? mapped = e.Metric?.Code switch
            {
                "goals" => (XpEventType.Goal, e.Delta * XpRules.Goal),
                "assists" => (XpEventType.Assist, e.Delta * XpRules.Assist),
                "plus" => (XpEventType.PlusMinus, e.Delta * XpRules.PlusMinus),
                "minus" => (XpEventType.PlusMinus, -e.Delta * XpRules.PlusMinus),
                _ => null
            };
            if (mapped == null) continue;

            add(memberId.Value, mapped.Value.type, mapped.Value.points, XpSourceKind.StatTrackerEntry, e.Id, e.CreatedAt);
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
                if (prevGrade != null && r.Grade < prevGrade) // grade 1 = best, lower is better
                    add(r.MemberId, XpEventType.SkillGradeImprovement, XpRules.SkillGradeImprovement,
                        XpSourceKind.SkillRating, r.Id, r.RatedAt);

                if (r.TargetGrade is int target && r.Grade <= target && (bestGrade == null || bestGrade > target))
                    add(r.MemberId, XpEventType.SkillTargetReached, XpRules.SkillTargetReached,
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
                if (best != null && (higherIsBetter ? value > best : value < best))
                    add(t.MemberId, XpEventType.TestPersonalRecord, XpRules.TestPersonalRecord,
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
            var type = XpRules.EventTypeFor(a.Type);
            var when = a.Appointment?.Start ?? a.AwardedAt;
            add(a.MemberId, type, XpRules.PointsFor(type), XpSourceKind.CoachAward, a.Id, when);
        }
    }

    public async Task<XpSummaryDto> GetSummaryAsync(int memberId, CancellationToken ct = default)
    {
        var events = await context.XpEvents.AsNoTracking()
            .Where(e => e.MemberId == memberId)
            .Select(e => new { e.Points, e.SeasonId, e.Type })
            .ToListAsync(ct);

        var total = events.Sum(e => e.Points);
        return new XpSummaryDto
        {
            MemberId = memberId,
            TotalXp = total,
            Career = XpProgression.Career(total),
            BySeason = events.Where(e => e.SeasonId != null)
                .GroupBy(e => e.SeasonId!.Value)
                .Select(g => new { SeasonId = g.Key, Xp = g.Sum(x => x.Points) })
                .Select(s => new SeasonXpDto { SeasonId = s.SeasonId, Xp = s.Xp, Stars = XpProgression.Stars(s.Xp) })
                .OrderBy(s => s.SeasonId)
                .ToList(),
            ByType = events.GroupBy(e => e.Type)
                .Select(g => new XpByTypeDto { Type = g.Key.ToString(), Xp = g.Sum(x => x.Points) })
                .Where(b => b.Xp != 0)
                .OrderByDescending(b => b.Xp)
                .ToList()
        };
    }
}
