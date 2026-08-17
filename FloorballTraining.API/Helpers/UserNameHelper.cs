using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Helpers;

internal static class UserNameHelper
{
    /// <summary>
    /// Resolves display names for a set of user IDs in a single DB query (avoids N+1).
    /// </summary>
    internal static async Task<Dictionary<string, string>> GetNameMapAsync(
        UserManager<AppUser> userManager,
        IReadOnlyCollection<string> userIds)
    {
        if (userIds.Count == 0) return new Dictionary<string, string>();
        return await userManager.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, FullName = ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim() })
            .ToDictionaryAsync(u => u.Id, u => u.FullName);
    }
}
