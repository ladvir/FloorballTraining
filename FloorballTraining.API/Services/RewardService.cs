using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Evaluates real-world reward eligibility (#105) from the same derived gamification state players see —
/// rank/total-XP (via <see cref="XpService"/>) and badges (<see cref="MemberBadge"/>). Idempotent: a
/// <see cref="MemberRewardClaim"/> is written once per (member, reward), so a re-run inserts nothing new.
/// Mirrors <see cref="BadgeService"/>; runs after XP+badges in <see cref="Jobs.GamificationRecomputeJob"/>.
/// ponytail: per-member XP summary in a loop (cached per run); batch only if the rescan gets slow.
/// </summary>
public class RewardService(FloorballTrainingContext context, XpService xp)
{
    /// <summary>Recompute all reward claims. Returns the number of newly created claims.</summary>
    public async Task<int> RecomputeAllAsync(CancellationToken ct = default)
    {
        var rewards = await context.ClubRewards.AsNoTracking().Where(r => r.IsActive).ToListAsync(ct);
        if (rewards.Count == 0) return 0;

        var rewardClubIds = rewards.Select(r => r.ClubId).ToHashSet();

        var clubOf = await context.Members.AsNoTracking()
            .Where(m => rewardClubIds.Contains(m.ClubId))
            .ToDictionaryAsync(m => m.Id, m => m.ClubId, ct);

        // Player memberships only — XP is a player thing (#104); a non-player earns no reward.
        var teamsOfPlayer = (await context.TeamMembers.AsNoTracking()
                .Where(tm => tm.IsPlayer)
                .Select(tm => new { tm.MemberId, tm.TeamId })
                .ToListAsync(ct))
            .Where(x => clubOf.ContainsKey(x.MemberId))
            .GroupBy(x => x.MemberId)
            .ToDictionary(g => g.Key, g => g.Where(x => x.TeamId != null).Select(x => x.TeamId!.Value).ToHashSet());
        var playerIds = teamsOfPlayer.Keys.ToHashSet();
        if (playerIds.Count == 0) return 0;

        var badgesOf = (await context.MemberBadges.AsNoTracking()
                .Where(b => playerIds.Contains(b.MemberId))
                .Select(b => new { b.MemberId, b.Code })
                .ToListAsync(ct))
            .GroupBy(b => b.MemberId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Code.ToString()).ToHashSet());

        var existing = (await context.MemberRewardClaims.AsNoTracking()
                .Select(c => new { c.MemberId, c.ClubRewardId })
                .ToListAsync(ct))
            .Select(c => (c.MemberId, c.ClubRewardId))
            .ToHashSet();

        var summaries = new Dictionary<int, XpSummaryDto>();
        async Task<XpSummaryDto> Summary(int mid) =>
            summaries.TryGetValue(mid, out var s) ? s : summaries[mid] = await xp.GetSummaryAsync(mid, ct);

        var toAdd = new List<MemberRewardClaim>();
        foreach (var reward in rewards)
        {
            // Club-wide (TeamId null) → every player in the club; team reward → only that team's players.
            var candidates = reward.TeamId == null
                ? playerIds.Where(id => clubOf[id] == reward.ClubId)
                : playerIds.Where(id => teamsOfPlayer[id].Contains(reward.TeamId.Value));

            foreach (var mid in candidates)
            {
                if (existing.Contains((mid, reward.Id))) continue;
                if (!await IsEligibleAsync(reward, mid, Summary, badgesOf)) continue;
                existing.Add((mid, reward.Id));
                toAdd.Add(new MemberRewardClaim { MemberId = mid, ClubRewardId = reward.Id });
            }
        }

        if (toAdd.Count > 0)
        {
            context.MemberRewardClaims.AddRange(toAdd);
            await context.SaveChangesAsync(ct);
        }
        return toAdd.Count;
    }

    private static async Task<bool> IsEligibleAsync(
        ClubReward r, int memberId, Func<int, Task<XpSummaryDto>> summary, Dictionary<int, HashSet<string>> badgesOf)
    {
        switch (r.TriggerType)
        {
            case RewardTriggerType.BadgeEarned:
                return badgesOf.TryGetValue(memberId, out var codes) && codes.Contains(r.TriggerValue);
            case RewardTriggerType.RankReached:
                return int.TryParse(r.TriggerValue, out var rank) && (await summary(memberId)).Career.RankIndex >= rank;
            case RewardTriggerType.XpThreshold:
                return int.TryParse(r.TriggerValue, out var need) && (await summary(memberId)).TotalXp >= need;
            default:
                return false;
        }
    }
}
