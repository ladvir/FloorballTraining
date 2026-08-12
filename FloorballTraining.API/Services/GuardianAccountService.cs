using FloorballTraining.API.Helpers;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;

namespace FloorballTraining.API.Services;

/// <summary>
/// Finds an existing login by e-mail, or creates a fresh guardian account (role "User").
/// Shared by the coach-invite flow (#102, <see cref="Controllers.MembersController.AddGuardian"/>)
/// and the parent self-request flow (#113, <see cref="Controllers.GuardianRequestsController"/>).
/// </summary>
public class GuardianAccountService(UserManager<AppUser> userManager)
{
    public record Result(AppUser User, string? GeneratedPassword, bool CreatedNewUser, string? Error);

    public async Task<Result> FindOrCreateAsync(string email, int defaultClubId, string? language)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user != null) return new Result(user, null, false, null);

        var password = PasswordGenerator.GenerateTemporary();
        var lang = (language ?? string.Empty).Trim().ToLowerInvariant();
        user = new AppUser
        {
            UserName = email,
            Email = email,
            DefaultClubId = defaultClubId,
            PreferredLanguage = lang.Length is >= 2 and <= 5 ? lang : null,
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
            return new Result(user, null, false, string.Join("; ", createResult.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, "User");
        return new Result(user, password, true, null);
    }
}
