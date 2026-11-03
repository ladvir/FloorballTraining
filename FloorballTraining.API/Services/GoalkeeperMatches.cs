using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>One goalkeeper's tracked match, shared by <see cref="XpService"/> (clean sheet / save % XP)
/// and <see cref="BadgeService"/> (clean-sheet badges) so both read the match the same way.</summary>
public record GoalkeeperMatch(
    int MemberId, int ParticipantId, int TeamId, DateTime When, bool CleanSheet, bool SavePctHit);

public static class GoalkeeperMatches
{
    /// <summary>
    /// Matches (stat tracker EventCategory 0) where the score was tracked — at least one score entry, else a
    /// 0:0 can't be told from "score not tracked". The conceded goals are the team's (entry Kind 2). When a
    /// tracker lists several goalkeepers only those with saves logged count as having played; a lone
    /// goalkeeper always counts. Save % is only judged for a lone playing goalkeeper (conceded goals can't
    /// be split between two), and needs <see cref="XpRules.SavePctMinShots"/> shots on goal.
    /// ponytail: a lone listed goalkeeper is assumed to have played; bench-only goalies need a played flag.
    /// </summary>
    public static async Task<List<GoalkeeperMatch>> LoadAsync(FloorballTrainingContext context, int? memberId = null, CancellationToken ct = default)
    {
        var trackers = await context.StatTrackers.AsNoTracking()
            .Where(t => t.EventCategory == 0 && t.Entries.Any(e => e.Kind == 1 || e.Kind == 2))
            .Where(t => t.Participants.Any(p => p.Role == 1 && (memberId == null || p.MemberId == memberId)))
            .Select(t => new
            {
                t.Id,
                t.TeamId,
                When = t.Appointment != null ? t.Appointment.Start : t.CreatedAt,
                Conceded = t.Entries.Where(e => e.Kind == 2).Sum(e => e.Delta),
                Goalies = t.Participants.Where(p => p.Role == 1).Select(p => new { p.Id, p.MemberId }).ToList(),
            })
            .ToListAsync(ct);
        if (trackers.Count == 0) return [];

        var trackerIds = trackers.Select(t => t.Id).ToList();
        var saves = await context.StatTrackerEntries.AsNoTracking()
            .Where(e => e.Kind == 0 && trackerIds.Contains(e.StatTrackerId) && e.Metric!.Code == "saves")
            .GroupBy(e => e.StatTrackerParticipantId!.Value)
            .Select(g => new { ParticipantId = g.Key, Saves = g.Sum(e => e.Delta) })
            .ToDictionaryAsync(x => x.ParticipantId, x => x.Saves, ct);

        var result = new List<GoalkeeperMatch>();
        foreach (var t in trackers)
        {
            var played = t.Goalies.Count == 1 ? t.Goalies : t.Goalies.Where(g => saves.GetValueOrDefault(g.Id) > 0).ToList();
            foreach (var g in played.Where(g => memberId == null || g.MemberId == memberId))
            {
                var hit = false;
                if (played.Count == 1)
                {
                    var shots = saves.GetValueOrDefault(g.Id) + t.Conceded;
                    hit = shots >= XpRules.SavePctMinShots && saves.GetValueOrDefault(g.Id) * 100 >= XpRules.SavePctThreshold * shots;
                }
                result.Add(new GoalkeeperMatch(g.MemberId, g.Id, t.TeamId, t.When, t.Conceded <= 0, hit));
            }
        }
        return result;
    }
}
