using System.Security.Claims;
using FloorballTraining.API.Dtos.Auth;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
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
        FloorballTrainingContext context) : BaseApiController
    {
        private static readonly string[] ValidRequestRoles = ["Coach", "HeadCoach"];

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

            if (request.ClubId.HasValue)
            {
                var club = await context.Clubs.FindAsync(request.ClubId.Value);
                if (club == null)
                    return BadRequest("Klub neexistuje");
                if (club.MaxRegistrationRole == null)
                    return BadRequest("Tento klub nepřijímá registrace");

                user.DefaultClubId = club.Id;
            }

            var result = await userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            await userManager.AddToRoleAsync(user, "User");

            if (request.ClubId.HasValue)
            {
                var member = new Member
                {
                    Name = $"{request.FirstName} {request.LastName}".Trim(),
                    Email = request.Email,
                    AppUserId = user.Id,
                    ClubId = request.ClubId.Value
                };
                context.Members.Add(member);
                await context.SaveChangesAsync();

                if (!string.IsNullOrEmpty(request.RequestedRole)
                    && ValidRequestRoles.Contains(request.RequestedRole))
                {
                    var club = await context.Clubs.FindAsync(request.ClubId.Value);
                    if (IsRoleWithinMax(request.RequestedRole, club!.MaxRegistrationRole!))
                    {
                        var roleRequest = new RoleRequest
                        {
                            MemberId = member.Id,
                            RequestedRole = request.RequestedRole,
                            CreatedAt = DateTime.UtcNow
                        };
                        context.RoleRequests.Add(roleRequest);
                        await context.SaveChangesAsync();
                    }
                }
            }

            var roles = await userManager.GetRolesAsync(user);
            return await BuildAuthResponseAsync(user, roles);
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

        private async Task<AuthResponse> BuildAuthResponseAsync(AppUser user, IList<string> roles)
        {
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(user.Id);
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
            };
        }

        private static readonly Dictionary<string, int> RoleLevels = new()
        {
            ["User"] = 0,
            ["Coach"] = 1,
            ["HeadCoach"] = 2
        };

        private static bool IsRoleWithinMax(string requested, string max)
        {
            return RoleLevels.TryGetValue(requested, out var reqLevel)
                   && RoleLevels.TryGetValue(max, out var maxLevel)
                   && reqLevel <= maxLevel;
        }
    }
}
