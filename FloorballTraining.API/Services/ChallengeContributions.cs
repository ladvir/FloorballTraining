using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Loads the per-member (member, when, amount) events each <see cref="ChallengeMetric"/> measures, from
/// the same coach-entered records as XP — attendance, goals, home training, skill grades and tests. Shared
/// by <see cref="ChallengeService"/> (individual challenges #108) and <see cref="TeamChallengeService"/>
/// (team challenges #156), which sum the same events over a team roster.
/// ponytail: full-history rescan per run (idempotent, cheap at club scale) — same as XP/badges.
/// </summary>
public class ChallengeContributions(FloorballTrainingContext context)
{
    /// <summary>A single metric event: <paramref name="Amount"/> may be signed (stats undo cancels).</summary>
    public record Contribution(int MemberId, DateTime When, int Amount);

    /// <summary>Every metric's contribution list; pass <paramref name="memberIds"/> to scope to a roster
    /// (null = all members).</summary>
    public async Task<Dictionary<ChallengeMetric, List<Contribution>>> LoadAsync(
        CancellationToken ct, IReadOnlyCollection<int>? memberIds = null)
    {
        return new Dictionary<ChallengeMetric, List<Contribution>>
        {
            [ChallengeMetric.TrainingAttendance] = await LoadTrainingAttendanceAsync(ct, memberIds),
            [ChallengeMetric.MatchGoal] = await LoadGoalsAsync(ct, memberIds),
            [ChallengeMetric.HomeTraining] = await LoadHomeTrainingAsync(ct, memberIds),
            [ChallengeMetric.SkillImprovement] = await LoadSkillImprovementsAsync(ct, memberIds),
            [ChallengeMetric.TestPersonalRecord] = await LoadTestRecordsAsync(ct, memberIds),
        };
    }

    private async Task<List<Contribution>> LoadTrainingAttendanceAsync(CancellationToken ct, IReadOnlyCollection<int>? memberIds)
    {
        var rows = await context.AppointmentAttendances.AsNoTracking()
            .Where(a => a.Status == 1)
            .Where(a => memberIds == null || memberIds.Contains(a.MemberId))
            .Include(a => a.Appointment)
            .ToListAsync(ct);
        return rows
            .Where(a => a.Appointment?.AppointmentType == AppointmentType.Training)
            .Select(a => new Contribution(a.MemberId, a.Appointment?.Start ?? a.RecordedAt, 1))
            .ToList();
    }

    private async Task<List<Contribution>> LoadGoalsAsync(CancellationToken ct, IReadOnlyCollection<int>? memberIds)
    {
        var rows = await context.StatTrackerEntries.AsNoTracking()
            .Where(e => e.Kind == 0 && e.StatTrackerParticipantId != null && e.StatTrackerMetricId != null)
            .Where(e => e.Metric!.Code == "goals")
            .Where(e => memberIds == null || memberIds.Contains(e.Participant!.MemberId))
            .Include(e => e.Participant)
            .Include(e => e.Metric)
            .ToListAsync(ct);
        return rows
            .Where(e => e.Participant != null)
            .Select(e => new Contribution(e.Participant!.MemberId, e.CreatedAt, e.Delta)) // Delta signed: undo cancels
            .ToList();
    }

    private async Task<List<Contribution>> LoadHomeTrainingAsync(CancellationToken ct, IReadOnlyCollection<int>? memberIds)
    {
        var rows = await context.HomeTrainingLogs.AsNoTracking()
            .Where(l => l.ConfirmedAt != null && l.RejectedAt == null)
            .Where(l => memberIds == null || memberIds.Contains(l.MemberId))
            .Select(l => new { l.MemberId, l.LoggedAt })
            .ToListAsync(ct);
        return rows.Select(l => new Contribution(l.MemberId, l.LoggedAt, 1)).ToList();
    }

    private async Task<List<Contribution>> LoadSkillImprovementsAsync(CancellationToken ct, IReadOnlyCollection<int>? memberIds)
    {
        var ratings = await context.PlayerSkillRatings.AsNoTracking()
            .Where(r => memberIds == null || memberIds.Contains(r.MemberId))
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

    private async Task<List<Contribution>> LoadTestRecordsAsync(CancellationToken ct, IReadOnlyCollection<int>? memberIds)
    {
        var results = await context.TestResults.AsNoTracking()
            .Where(t => t.NumericValue != null)
            .Where(t => memberIds == null || memberIds.Contains(t.MemberId))
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
}
