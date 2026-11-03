using System.Security.Claims;
using FloorballTraining.API.Helpers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

public record AddTeamGuestRequest(string Email, string? FirstName, string? LastName, bool SendCredentials, string? Language, string? Password = null);

/// <summary>Read-only guest accounts per team. HeadCoach+ of the team's club (or Admin) manages them.</summary>
[Authorize]
public class TeamGuestsController(
    FloorballTrainingContext db,
    IClubRoleService clubRoleService,
    IAuditService auditService,
    UserManager<AppUser> userManager,
    ICredentialsEmailService credentialsEmailService,
    ILogger<TeamGuestsController> logger) : BaseApiController
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private async Task<bool> CanManageAsync(int teamId)
    {
        var teamClubId = await db.Teams.Where(t => t.Id == teamId).Select(t => (int?)t.ClubId).FirstOrDefaultAsync();
        if (teamClubId == null) return false;
        var role = await clubRoleService.GetUserClubRoleAsync(UserId);
        return role.EffectiveRole == "Admin"
            || (role.EffectiveRole is "HeadCoach" or "ClubAdmin" && role.ClubId == teamClubId);
    }

    [HttpGet("/teams/{teamId:int}/guests")]
    public async Task<IActionResult> GetAll(int teamId)
    {
        if (!await CanManageAsync(teamId)) return Forbid();
        var links = await db.TeamGuests.Where(g => g.TeamId == teamId).OrderBy(g => g.CreatedAt).ToListAsync();
        var ids = links.Select(l => l.AppUserId).ToList();
        var users = await userManager.Users.Where(u => ids.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
        return Ok(links.Select(l => new
        {
            linkId = l.Id,
            userId = l.AppUserId,
            email = users.GetValueOrDefault(l.AppUserId)?.Email ?? string.Empty,
            firstName = users.GetValueOrDefault(l.AppUserId)?.FirstName ?? string.Empty,
            lastName = users.GetValueOrDefault(l.AppUserId)?.LastName ?? string.Empty,
            createdAt = l.CreatedAt,
        }));
    }

    [HttpPost("/teams/{teamId:int}/guests")]
    public async Task<IActionResult> Add(int teamId, [FromBody] AddTeamGuestRequest request)
    {
        if (!await CanManageAsync(teamId)) return Forbid();
        var email = request.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return BadRequest(new { message = "Email je povinný." });

        string? generatedPassword = null;
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            var chosenPassword = !string.IsNullOrWhiteSpace(request.Password);
            if (chosenPassword && request.Password!.Length < 6)
                return BadRequest(new { message = "Heslo musí mít alespoň 6 znaků." });
            generatedPassword = chosenPassword ? request.Password : PasswordGenerator.GenerateTemporary();
            var lang = (request.Language ?? string.Empty).Trim().ToLowerInvariant();
            user = new AppUser
            {
                UserName = email,
                Email = email,
                FirstName = request.FirstName?.Trim() ?? string.Empty,
                LastName = request.LastName?.Trim() ?? string.Empty,
                DefaultClubId = await db.Teams.Where(t => t.Id == teamId).Select(t => t.ClubId).FirstAsync(),
                PreferredLanguage = lang.Length is >= 2 and <= 5 ? lang : null,
            };
            var created = await userManager.CreateAsync(user, generatedPassword);
            if (!created.Succeeded)
                return BadRequest(new { message = string.Join("; ", created.Errors.Select(e => e.Description)) });
            await userManager.AddToRoleAsync(user, "User");
        }
        else if (await db.Members.AnyAsync(m => m.AppUserId == user.Id) || await userManager.IsInRoleAsync(user, "Admin"))
        {
            // A guest must not be a club member (player/coach) — that account already has its own access.
            return BadRequest(new { message = "Tento účet je členem klubu, nelze z něj udělat hosta." });
        }

        if (await db.TeamGuests.AnyAsync(g => g.TeamId == teamId && g.AppUserId == user.Id))
            return BadRequest(new { message = "Host už k tomuto týmu má přístup." });

        db.TeamGuests.Add(new TeamGuest { TeamId = teamId, AppUserId = user.Id, CreatedByUserId = UserId });
        await db.SaveChangesAsync();

        var emailSent = false;
        if (generatedPassword != null && request.SendCredentials)
        {
            try
            {
                await credentialsEmailService.SendWelcomeAsync(email, user.FirstName, generatedPassword);
                emailSent = true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send credentials email to new guest {Email}", email);
            }
        }

        await auditService.LogAsync(AuditActions.GuestLinked, "Team", teamId.ToString(), details: new { guest = email });
        return Ok(new { userId = user.Id, email, loginCreated = generatedPassword != null, emailSent, password = generatedPassword != null && !emailSent && string.IsNullOrWhiteSpace(request.Password) ? generatedPassword : null });
    }

    [HttpDelete("/teams/{teamId:int}/guests/{linkId:int}")]
    public async Task<IActionResult> Remove(int teamId, int linkId)
    {
        if (!await CanManageAsync(teamId)) return Forbid();
        var link = await db.TeamGuests.FirstOrDefaultAsync(g => g.Id == linkId && g.TeamId == teamId);
        if (link == null) return NotFound();
        db.TeamGuests.Remove(link);
        await db.SaveChangesAsync();
        await auditService.LogAsync(AuditActions.GuestUnlinked, "Team", teamId.ToString(), details: new { guestUserId = link.AppUserId });
        return NoContent();
    }

    /// <summary>Reset the guest's password to a fresh temporary one (e-mailed, and returned if sending fails).</summary>
    [HttpPost("/teams/{teamId:int}/guests/{linkId:int}/resend")]
    public async Task<IActionResult> Resend(int teamId, int linkId)
    {
        if (!await CanManageAsync(teamId)) return Forbid();
        var link = await db.TeamGuests.FirstOrDefaultAsync(g => g.Id == linkId && g.TeamId == teamId);
        if (link == null) return NotFound();
        var user = await userManager.FindByIdAsync(link.AppUserId);
        if (user?.Email == null) return NotFound();

        var newPassword = PasswordGenerator.GenerateTemporary();
        var reset = await userManager.ResetPasswordAsync(user, await userManager.GeneratePasswordResetTokenAsync(user), newPassword);
        if (!reset.Succeeded)
            return BadRequest(new { message = string.Join("; ", reset.Errors.Select(e => e.Description)) });

        var emailSent = false;
        try
        {
            await credentialsEmailService.SendPasswordResetAsync(user.Email, user.FirstName, newPassword);
            emailSent = true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send guest password reset to {Email}", user.Email);
        }
        return Ok(new { emailSent, password = emailSent ? null : newPassword });
    }
}
