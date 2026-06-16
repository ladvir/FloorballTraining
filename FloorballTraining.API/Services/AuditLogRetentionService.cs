using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Periodically deletes audit log entries older than the configured retention window
/// (AuditLog:RetentionDays, default 730 days ≈ 2 years). Waits 5 minutes after startup
/// before the first run — this prevents crash-loop restarts from repeatedly firing the
/// bulk DELETE — then repeats every 24 hours. Resilient: a failed run never crashes the host.
/// </summary>
public class AuditLogRetentionService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<AuditLogRetentionService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var retentionDays = configuration.GetValue<int?>("AuditLog:RetentionDays") ?? 730;
        using var timer = new PeriodicTimer(TimeSpan.FromHours(24));

        // Delay before first cleanup so a crash-loop restart cycle doesn't fire the
        // bulk DELETE on every startup.
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

        do
        {
            await CleanupAsync(retentionDays, stoppingToken);
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task CleanupAsync(int retentionDays, CancellationToken ct)
    {
        try
        {
            var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

            // The DbContext factory is registered scoped, so resolve it inside a scope.
            using var scope = scopeFactory.CreateScope();
            var contextFactory = scope.ServiceProvider
                .GetRequiredService<IDbContextFactory<FloorballTrainingContext>>();

            await using var ctx = await contextFactory.CreateDbContextAsync(ct);
            var deleted = await ctx.AuditLogs
                .Where(a => a.OccurredAt < cutoff)
                .ExecuteDeleteAsync(ct);

            if (deleted > 0)
                logger.LogInformation(
                    "Audit log retention: deleted {Count} entries older than {Days} days",
                    deleted, retentionDays);
        }
        catch (OperationCanceledException)
        {
            // Host is shutting down — ignore.
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Audit log retention cleanup failed");
        }
    }
}
