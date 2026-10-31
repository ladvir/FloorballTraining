using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// A player who trains with two teams is recorded present in one and absent in the other. This finds those
/// absences so they can be left out of the attendance denominator — the player is then 100 % when they only ever
/// miss a training because they were at the other team's.
/// Rule: an absence (any non-present status) at team A's training is forgiven when the same member is present at a
/// training of another team that day. If that day is single-phase on both sides (one training per team), the same
/// day is enough; if either team has several trainings that day, the two trainings must overlap in time.
/// </summary>
public static class AttendanceForgiveness
{
    public sealed record Rec(int MemberId, int AppointmentId, int TeamId, DateTime Start, DateTime End, int Status);

    /// <summary>(MemberId, AppointmentId) pairs of non-present records that must not count against the member.</summary>
    public static HashSet<(int MemberId, int AppointmentId)> Forgiven(IEnumerable<Rec> recs)
    {
        var forgiven = new HashSet<(int, int)>();
        foreach (var g in recs.GroupBy(r => (r.MemberId, r.Start.Date)))
        {
            var day = g.ToList();
            var present = day.Where(r => r.Status == 1).ToList();
            if (present.Count == 0) continue;
            foreach (var miss in day.Where(r => r.Status != 1))
            {
                var others = present.Where(p => p.TeamId != miss.TeamId).ToList();
                if (others.Count == 0) continue;
                var multiPhase = day.Count(r => r.TeamId == miss.TeamId) > 1
                                 || others.Any(p => day.Count(r => r.TeamId == p.TeamId) > 1);
                if (!multiPhase || others.Any(p => p.Start < miss.End && miss.Start < p.End))
                    forgiven.Add((miss.MemberId, miss.AppointmentId));
            }
        }
        return forgiven;
    }

    /// <summary>Loads the members' training attendance across all teams in [from, toExcl) and returns the forgiven pairs.</summary>
    public static async Task<HashSet<(int MemberId, int AppointmentId)>> LoadForgivenAsync(
        FloorballTrainingContext context, IReadOnlyCollection<int> memberIds, DateTime from, DateTime toExcl, CancellationToken ct = default)
    {
        var recs = await context.AppointmentAttendances.AsNoTracking()
            .Where(a => a.Appointment != null && a.Appointment.TeamId != null
                        && a.Appointment.AppointmentType == AppointmentType.Training
                        && a.Appointment.Start >= from && a.Appointment.Start < toExcl
                        && memberIds.Contains(a.MemberId))
            .Select(a => new Rec(a.MemberId, a.AppointmentId, a.Appointment!.TeamId!.Value,
                a.Appointment.Start, a.Appointment.End, a.Status))
            .ToListAsync(ct);
        return Forgiven(recs);
    }
}
