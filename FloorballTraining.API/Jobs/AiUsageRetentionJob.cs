using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Jobs;

/// <summary>
/// Hangfire recurring job that purges AI usage metering rows older than the
/// configured retention window (AiUsage:RetentionDays, default 365 days).
/// Scheduled daily at 02:30 UTC in Program.cs via RecurringJob.AddOrUpdate.
/// </summary>
public sealed class AiUsageRetentionJob(
    IDbContextFactory<FloorballTrainingContext> contextFactory,
    IConfiguration configuration,
    ILogger<AiUsageRetentionJob> logger)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var retentionDays = configuration.GetValue<int?>("AiUsage:RetentionDays") ?? 365;
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        await using var ctx = await contextFactory.CreateDbContextAsync(cancellationToken);
        var deleted = await ctx.AiUsageLogs
            .Where(l => l.CreatedAt < cutoff)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted > 0)
            logger.LogInformation(
                "AI usage retention: deleted {Count} entries older than {Days} days",
                deleted, retentionDays);
    }
}
