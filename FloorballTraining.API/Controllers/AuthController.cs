using System.Security.Claims;
using System.Web;
using FloorballTraining.API.Dtos.Auth;
using FloorballTraining.API.Services;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.Services.EmailService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers
{
    public class AuthController(
        UserManager<AppUser> userManager,
        TokenService tokenService,
        IClubRoleService clubRoleService,
        IEmailSender emailSender,
        IConfiguration configuration,
        FloorballTrainingContext context) : BaseApiController
    {
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null) return Unauthorized("Neplatné přihlašovací údaje");

            var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid) return Unauthorized("Neplatné přihlašovací údaje");

            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<AuthResponse>> GetCurrentUser()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<ActionResult<AuthResponse>> UpdateProfile([FromBody] Dtos.Auth.UpdateProfileDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            if (!string.IsNullOrEmpty(dto.FirstName))
                user.FirstName = dto.FirstName.Trim();
            if (!string.IsNullOrEmpty(dto.LastName))
                user.LastName = dto.LastName.Trim();

            // Email change
            if (!string.IsNullOrEmpty(dto.Email) && dto.Email.Trim() != user.Email)
            {
                var newEmail = dto.Email.Trim();
                var existing = await userManager.FindByEmailAsync(newEmail);
                if (existing != null)
                    return BadRequest(new { message = "Tento email je již registrován." });

                user.Email = newEmail;
                user.NormalizedEmail = newEmail.ToUpperInvariant();
                user.UserName = newEmail;
                user.NormalizedUserName = newEmail.ToUpperInvariant();
            }

            // Password change
            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                if (string.IsNullOrEmpty(dto.CurrentPassword))
                    return BadRequest(new { message = "Pro změnu hesla zadejte aktuální heslo." });

                var passResult = await userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
                if (!passResult.Succeeded)
                    return BadRequest(new { message = string.Join("; ", passResult.Errors.Select(e => e.Description)) });
            }

            await userManager.UpdateAsync(user);
            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
        }

        [Authorize]
        [HttpPut("preferences")]
        public async Task<ActionResult<AuthResponse>> UpdatePreferences([FromBody] UserPreferencesDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            user.DefaultClubId = dto.DefaultClubId;
            user.DefaultTeamId = dto.DefaultTeamId;
            await userManager.UpdateAsync(user);

            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
        }

        [Authorize]
        [HttpPut("active-club")]
        public async Task<ActionResult<AuthResponse>> SetActiveClub([FromBody] SetActiveClubDto dto)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            var roles = await userManager.GetRolesAsync(user);
            var isAdmin = roles.Contains("Admin");

            if (!isAdmin)
            {
                var hasMembership = await context.Members
                    .AnyAsync(m => m.AppUserId == user.Id && m.ClubId == dto.ClubId);
                if (!hasMembership)
                    return BadRequest("Nejste členem tohoto klubu.");
            }

            user.DefaultClubId = dto.ClubId;
            user.DefaultTeamId = null;
            await userManager.UpdateAsync(user);

            return await BuildAuthResponseAsync(user, roles);
        }

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user != null)
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(user);
                var frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:3000";
                var encodedToken = HttpUtility.UrlEncode(token);
                var encodedEmail = HttpUtility.UrlEncode(request.Email);
                var resetLink = $"{frontendBaseUrl}/reset-password?email={encodedEmail}&token={encodedToken}";

                var message = new Message(
                    [request.Email],
                    "Reset hesla - FloTr",
                    $"<h2>Reset hesla</h2>" +
                    $"<p>Pro nastavení nového hesla klikněte na následující odkaz:</p>" +
                    $"<p><a href=\"{resetLink}\">Resetovat heslo</a></p>" +
                    $"<p>Pokud jste o reset hesla nežádali, tento email ignorujte.</p>" +
                    $"<p>Odkaz je platný po omezenou dobu.</p>");

                await emailSender.SendEmailAsync(message);
            }

            // Always return OK to not reveal if email exists
            return Ok(new { message = "Pokud email existuje v systému, odeslali jsme instrukce pro reset hesla." });
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return BadRequest(new { message = "Neplatný požadavek na reset hesla." });

            var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            return Ok(new { message = "Heslo bylo úspěšně změněno." });
        }

        private async Task<AuthResponse> BuildAuthResponseAsync(AppUser user, IList<string> roles)
        {
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(user.Id);
            var clubMemberships = await clubRoleService.GetAllUserClubRolesAsync(user.Id);
            return new AuthResponse
            {
                Id = user.Id,
                Token = tokenService.CreateToken(user, roles),
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles,
                DefaultClubId = user.DefaultClubId,
                DefaultTeamId = user.DefaultTeamId,
                EffectiveRole = roleInfo.EffectiveRole,
                ClubId = roleInfo.ClubId,
                CoachTeamIds = roleInfo.CoachTeamIds,
                ClubMemberships = clubMemberships,
            };
        }

    }
}
