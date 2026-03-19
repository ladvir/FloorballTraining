using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

public record ClubRoleInfo(
    string EffectiveRole,
    int? ClubId,
    List<int> CoachTeamIds
);

public interface IClubRoleService
{
    Task<ClubRoleInfo> GetUserClubRoleAsync(string userId, int? clubId = null);
}

public class ClubRoleService(
    FloorballTrainingContext context,
    UserManager<AppUser> userManager) : IClubRoleService
{
    public async Task<ClubRoleInfo> GetUserClubRoleAsync(string userId, int? clubId = null)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return new ClubRoleInfo("User", null, []);

        var roles = await userManager.GetRolesAsync(user);
        if (roles.Contains("Admin"))
            return new ClubRoleInfo("Admin", clubId ?? user.DefaultClubId, []);

        var targetClubId = clubId ?? user.DefaultClubId;
        if (targetClubId == null)
            return new ClubRoleInfo("User", null, []);

        var member = await context.Members
            .Include(m => m.TeamMembers)
            .FirstOrDefaultAsync(m => m.AppUserId == userId && m.ClubId == targetClubId);

        if (member == null)
            return new ClubRoleInfo("User", targetClubId, []);

        var coachTeamIds = member.TeamMembers
            .Where(tm => tm.IsCoach && tm.TeamId.HasValue)
            .Select(tm => tm.TeamId!.Value)
            .ToList();

        if (member.HasClubRoleMainCoach)
            return new ClubRoleInfo("HeadCoach", targetClubId, coachTeamIds);

        if (member.HasClubRoleCoach)
            return new ClubRoleInfo("Coach", targetClubId, coachTeamIds);

        return new ClubRoleInfo("User", targetClubId, coachTeamIds);
    }
}
