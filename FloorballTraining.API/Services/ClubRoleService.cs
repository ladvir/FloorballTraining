using FloorballTraining.API.Dtos.Auth;
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
    Task<List<UserClubMembershipDto>> GetAllUserClubRolesAsync(string userId);
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

        // If no club set, try to find any member record for this user
        if (targetClubId == null)
        {
            var anyMember = await context.Members
                .Include(m => m.TeamMembers)
                .FirstOrDefaultAsync(m => m.AppUserId == userId && m.ClubId > 0);
            if (anyMember == null)
                return new ClubRoleInfo("User", null, []);
            return new ClubRoleInfo(
                ComputeEffectiveRole(anyMember),
                anyMember.ClubId,
                GetCoachTeamIds(anyMember));
        }

        var member = await context.Members
            .Include(m => m.TeamMembers)
            .FirstOrDefaultAsync(m => m.AppUserId == userId && m.ClubId == targetClubId);

        if (member == null)
            return new ClubRoleInfo("User", targetClubId, []);

        return new ClubRoleInfo(
            ComputeEffectiveRole(member),
            targetClubId,
            GetCoachTeamIds(member));
    }

    public async Task<List<UserClubMembershipDto>> GetAllUserClubRolesAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return [];

        var isAdmin = (await userManager.GetRolesAsync(user)).Contains("Admin");

        var members = await context.Members
            .Include(m => m.Club)
            .Include(m => m.TeamMembers)
            .Where(m => m.AppUserId == userId && m.Club != null)
            .ToListAsync();

        if (isAdmin)
        {
            // Admin sees all clubs, not just ones with Member records
            var allClubs = await context.Clubs.OrderBy(c => c.Name).ToListAsync();
            return allClubs.Select(c => new UserClubMembershipDto
            {
                ClubId = c.Id,
                ClubName = c.Name,
                MemberId = members.FirstOrDefault(m => m.ClubId == c.Id)?.Id ?? 0,
                EffectiveRole = "Admin",
                CoachTeamIds = [],
            }).ToList();
        }

        return members.Select(m => new UserClubMembershipDto
        {
            ClubId = m.ClubId,
            ClubName = m.Club!.Name,
            MemberId = m.Id,
            EffectiveRole = ComputeEffectiveRole(m),
            CoachTeamIds = GetCoachTeamIds(m),
        }).ToList();
    }

    private static string ComputeEffectiveRole(CoreBusiness.Member member)
    {
        if (member.HasClubRoleMainCoach) return "HeadCoach";
        if (member.HasClubRoleCoach) return "Coach";
        return "User";
    }

    private static List<int> GetCoachTeamIds(CoreBusiness.Member member)
    {
        return member.TeamMembers
            .Where(tm => tm.IsCoach && tm.TeamId.HasValue)
            .Select(tm => tm.TeamId!.Value)
            .ToList();
    }
}
