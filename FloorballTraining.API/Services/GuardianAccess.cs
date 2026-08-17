using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// A guardian (#102) is a plain "User" account with no own member card but at least one
/// MemberGuardian link. Shared so the account-type resolver (AuthController) and the leaderboard
/// privacy gate (XpController) agree on exactly who counts as a guardian — a guardian may see
/// their own children's placement, never the full club žebříček.
/// </summary>
public static class GuardianAccess
{
    public static async Task<bool> IsGuardianAsync(this FloorballTrainingContext context, string userId, CancellationToken ct = default)
    {
        if (await context.Members.AnyAsync(m => m.AppUserId == userId, ct)) return false;
        return await context.MemberGuardians.AnyAsync(g => g.GuardianAppUserId == userId, ct);
    }
}
