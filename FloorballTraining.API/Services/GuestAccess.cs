using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// A guest is a login with no own member card and at least one TeamGuest link. Read-only:
/// <see cref="Middlewares.GuestReadOnlyMiddleware"/> rejects every write for them.
/// </summary>
public static class GuestAccess
{
    public static async Task<bool> IsGuestAsync(this FloorballTrainingContext context, string userId, CancellationToken ct = default)
    {
        if (await context.Members.AnyAsync(m => m.AppUserId == userId, ct)) return false;
        return await context.TeamGuests.AnyAsync(g => g.AppUserId == userId, ct);
    }

    public static Task<List<int>> GuestTeamIdsAsync(this FloorballTrainingContext context, string userId, CancellationToken ct = default) =>
        context.TeamGuests.Where(g => g.AppUserId == userId).Select(g => g.TeamId).ToListAsync(ct);
}
