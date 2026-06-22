using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Jobs;

/// <summary>
/// Hangfire recurring job that purges audit log entries older than the configured
/// retention window (AuditLog:RetentionDays, default 730 days ≈ 2 years).
/// Scheduled daily at 02:00 UTC in Program.cs via RecurringJob.AddOrUpdate.
/// </summary>
public sealed class AuditLogRetentionJob(
    IDbContextFactory<FloorballTrainingContext> contextFactory,
    IConfiguration configuration,
    ILogger<AuditLogRetentionJob> logger)
{
    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var retentionDays = configuration.GetValue<int?>("AuditLog:RetentionDays") ?? 730;
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        await using var ctx = await contextFactory.CreateDbContextAsync(cancellationToken);
        var deleted = await ctx.AuditLogs
            .Where(a => a.OccurredAt < cutoff)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted > 0)
            logger.LogInformation(
                "Audit log retention: deleted {Count} entries older than {Days} days",
                deleted, retentionDays);
    }
}
