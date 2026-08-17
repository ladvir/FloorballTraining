using FloorballTraining.CoreBusiness;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FloorballTraining.Plugins.EFCoreSqlServer;

/// <summary>
/// Sets CreatedAt/CreatedByUserId on insert and UpdatedAt/UpdatedByUserId on update
/// for any entity that implements <see cref="IAuditable"/>.
/// The <paramref name="getCurrentUserId"/> delegate is supplied by the API layer so
/// this plugin does not take a hard dependency on ASP.NET Core Http abstractions.
/// </summary>
public sealed class AuditableInterceptor(Func<string?> getCurrentUserId) : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ApplyAuditFields(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        ApplyAuditFields(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    private void ApplyAuditFields(DbContext? context)
    {
        if (context == null) return;

        var userId = getCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries<IAuditable>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    // Don't overwrite if the caller already set it explicitly (e.g. Training/Activity controllers).
                    entry.Entity.CreatedByUserId ??= userId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedByUserId = userId;
                    break;
            }
        }
    }
}
