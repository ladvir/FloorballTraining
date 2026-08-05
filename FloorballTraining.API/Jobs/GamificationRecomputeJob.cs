using FloorballTraining.API.Services;
using Hangfire;

namespace FloorballTraining.API.Jobs;

/// <summary>
/// Rebuilds the XP ledger (#94) and milestone badges (#97) from the coach-entered source records.
/// Enqueued instantly after any source write (attendance, match stats, skill ratings, tests) via
/// <see cref="Infrastructure.GamificationRecomputeInterceptor"/>, and by the admin manual trigger.
///
/// Idempotent: both recomputes dedupe by (Type, SourceKind, SourceId) / (member, code, season), so a
/// re-run never awards XP twice. <see cref="DisableConcurrentExecutionAttribute"/> serializes runs
/// (WorkerCount=2) so two runs can't race the unique index.
/// </summary>
public sealed class GamificationRecomputeJob(
    XpService xp,
    BadgeService badges,
    RewardService rewards,
    ILogger<GamificationRecomputeJob> logger)
{
    [DisableConcurrentExecution(timeoutInSeconds: 300)]
    public async Task RunAsync(CancellationToken ct = default)
    {
        var xpInserted = await xp.RecomputeAllAsync(ct);
        var badgesInserted = await badges.RecomputeAllAsync(ct);
        // Rewards depend on the fresh rank/XP/badges above, so they run last (#105).
        var claimsInserted = await rewards.RecomputeAllAsync(ct);
        if (xpInserted > 0 || badgesInserted > 0 || claimsInserted > 0)
            logger.LogInformation(
                "Gamification recompute: +{Xp} XP events, +{Badges} badges, +{Claims} reward claims",
                xpInserted, badgesInserted, claimsInserted);
    }
}
