using System.Runtime.CompilerServices;
using FloorballTraining.API.Jobs;
using FloorballTraining.CoreBusiness;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FloorballTraining.API.Infrastructure;

/// <summary>
/// After any write to an XP source record (attendance, match stats, skill ratings, tests), enqueues a
/// near-instant <see cref="GamificationRecomputeJob"/> so players' XP/badges update without a manual
/// recompute. Detection runs pre-save (entity states available); the enqueue runs post-save (rows
/// committed) so the job sees them.
///
/// The job only inserts XpEvent/MemberBadge — neither is an XP source type — so the job's own save
/// never re-triggers this interceptor (no loop). Deletes are triggers too, so removing/downgrading a
/// source record makes the recompute prune the now-orphaned XP.
///
/// ponytail: whole-ledger recompute per trigger (idempotent, cheap at club scale); add incremental
/// per-record derivation only if the rescan gets slow. Raw bulk deletes via ExecuteDelete bypass the
/// change tracker (no trigger) — the admin manual recompute covers that rare case.
/// </summary>
public sealed class GamificationRecomputeInterceptor : SaveChangesInterceptor
{
    private static readonly object Marker = new();

    // Carries "this save touched a source record" from pre-save to post-save, keyed by the DbContext
    // instance (each request/job has its own), so the singleton interceptor stays thread-safe.
    private readonly ConditionalWeakTable<DbContext, object> _pending = new();

    /// <summary>Entity types whose write should trigger an XP/badge recompute. (Public for testing.)</summary>
    public static bool IsXpSource(object entity) =>
        entity is AppointmentAttendance or StatTrackerEntry or PlayerSkillRating or TestResult or XpCoachAward;

    private void Detect(DbContext? context)
    {
        if (context == null) return;
        var touched = context.ChangeTracker.Entries().Any(e =>
            (e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted) && IsXpSource(e.Entity));
        if (touched) _pending.AddOrUpdate(context, Marker);
    }

    private void FlushIfPending(DbContext? context)
    {
        if (context == null || !_pending.TryGetValue(context, out _)) return;
        _pending.Remove(context);
        BackgroundJob.Enqueue<GamificationRecomputeJob>(j => j.RunAsync(CancellationToken.None));
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Detect(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Detect(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        FlushIfPending(eventData.Context);
        return base.SavedChanges(eventData, result);
    }

    public override ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        FlushIfPending(eventData.Context);
        return base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData)
    {
        if (eventData.Context != null) _pending.Remove(eventData.Context);
        base.SaveChangesFailed(eventData);
    }

    public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
    {
        if (eventData.Context != null) _pending.Remove(eventData.Context);
        return base.SaveChangesFailedAsync(eventData, cancellationToken);
    }
}
