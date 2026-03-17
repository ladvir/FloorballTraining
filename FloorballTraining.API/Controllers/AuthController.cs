using System.Security.Claims;
using FloorballTraining.API.Dtos.Auth;
using FloorballTraining.API.Services;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers
{
    public class AuthController(
        UserManager<AppUser> userManager,
        TokenService tokenService) : BaseApiController
    {
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        {
            if (await userManager.FindByEmailAsync(request.Email) != null)
                return BadRequest("Email je již registrován");

            var user = new AppUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName
            };

            var result = await userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            await userManager.AddToRoleAsync(user, "User");
            var roles = await userManager.GetRolesAsync(user);

            return BuildAuthResponse(user, roles);
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null) return Unauthorized("Neplatné přihlašovací údaje");

            var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid) return Unauthorized("Neplatné přihlašovací údaje");

            var roles = await userManager.GetRolesAsync(user);

            return BuildAuthResponse(user, roles);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<AuthResponse>> GetCurrentUser()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await userManager.FindByEmailAsync(email!);
            if (user == null) return NotFound();

            var roles = await userManager.GetRolesAsync(user);

            return BuildAuthResponse(user, roles);
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

            return BuildAuthResponse(user, roles);
        }

        private AuthResponse BuildAuthResponse(AppUser user, IList<string> roles) => new()
        {
            Id = user.Id,
            Token = tokenService.CreateToken(user, roles),
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles,
            DefaultClubId = user.DefaultClubId,
            DefaultTeamId = user.DefaultTeamId,
        };
    }
}
