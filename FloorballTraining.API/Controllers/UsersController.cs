using FloorballTraining.API.Dtos.Users;
using FloorballTraining.API.Services;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers
{
    [Authorize(Roles = "Admin")]
    public class UsersController(
        UserManager<AppUser> userManager,
        FloorballTrainingContext context,
        IClubRoleService clubRoleService) : BaseApiController
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var users = await userManager.Users.ToListAsync();
            var result = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await userManager.GetRolesAsync(user);
                var roleInfo = await clubRoleService.GetUserClubRoleAsync(user.Id);

                var member = await context.Members
                    .Include(m => m.Club)
                    .FirstOrDefaultAsync(m => m.AppUserId == user.Id);

                result.Add(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Roles = roles,
                    EffectiveRole = roleInfo.EffectiveRole,
                    ClubName = member?.Club?.Name,
                    ClubId = member?.ClubId,
                    MemberId = member?.Id,
                });
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
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

            // Assign club
            if (request.ClubId.HasValue)
            {
                var club = await context.Clubs.FindAsync(request.ClubId.Value);
                if (club == null) return BadRequest("Klub neexistuje");
                user.DefaultClubId = club.Id;
            }

            var createResult = await userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
                return BadRequest(createResult.Errors.Select(e => e.Description));

            // Set Identity role
            var identityRole = request.Role is "Admin" ? "Admin" : "User";
            await userManager.AddToRoleAsync(user, identityRole);

            // Create Member if club assigned
            CoreBusiness.Member? member = null;
            if (request.ClubId.HasValue)
            {
                member = new CoreBusiness.Member
                {
                    FirstName = request.FirstName?.Trim() ?? string.Empty,
                    LastName = request.LastName?.Trim() ?? string.Empty,
                    Email = request.Email,
                    AppUserId = user.Id,
                    ClubId = request.ClubId.Value,
                    HasClubRoleCoach = request.Role is "Coach" or "HeadCoach",
                    HasClubRoleMainCoach = request.Role == "HeadCoach",
                };
                context.Members.Add(member);
                await context.SaveChangesAsync();
            }

            var roles = await userManager.GetRolesAsync(user);
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(user.Id);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles,
                EffectiveRole = roleInfo.EffectiveRole,
                ClubName = member?.Club?.Name,
                ClubId = member?.ClubId,
                MemberId = member?.Id,
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(string id)
        {
            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var roles = await userManager.GetRolesAsync(user);
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(user.Id);

            var member = await context.Members
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.AppUserId == user.Id);

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles,
                EffectiveRole = roleInfo.EffectiveRole,
                ClubName = member?.Club?.Name,
                ClubId = member?.ClubId,
                MemberId = member?.Id,
            };
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(string id, UpdateUserRoleRequest request)
        {
            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            // Handle Identity roles (Admin/User)
            if (request.Role is "Admin" or "User")
            {
                var currentRoles = await userManager.GetRolesAsync(user);
                await userManager.RemoveFromRolesAsync(user, currentRoles);

                var result = await userManager.AddToRoleAsync(user, request.Role);
                if (!result.Succeeded)
                    return BadRequest(result.Errors.Select(e => e.Description));

                // If setting to Admin, clear club roles (Admin overrides them)
                return NoContent();
            }

            // Handle club roles (Coach/HeadCoach)
            if (request.Role is "Coach" or "HeadCoach")
            {
                var member = await context.Members
                    .FirstOrDefaultAsync(m => m.AppUserId == id);
                if (member == null)
                    return BadRequest("Uživatel nemá přiřazený Member záznam v žádném klubu");

                member.HasClubRoleCoach = request.Role is "Coach" or "HeadCoach";
                member.HasClubRoleMainCoach = request.Role == "HeadCoach";
                await context.SaveChangesAsync();

                // Ensure Identity role is User (not Admin)
                var currentRoles = await userManager.GetRolesAsync(user);
                if (!currentRoles.Contains("User"))
                {
                    await userManager.RemoveFromRolesAsync(user, currentRoles);
                    await userManager.AddToRoleAsync(user, "User");
                }

                return NoContent();
            }

            return BadRequest("Neplatná role");
        }

        [HttpPut("{id}/club")]
        public async Task<IActionResult> UpdateClub(string id, [FromBody] UpdateUserClubRequest request)
        {
            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            if (request.ClubId.HasValue)
            {
                var club = await context.Clubs.FindAsync(request.ClubId.Value);
                if (club == null) return BadRequest("Klub neexistuje");
            }

            // Find existing member for this user
            var existingMember = await context.Members
                .FirstOrDefaultAsync(m => m.AppUserId == id);

            if (request.ClubId == null)
            {
                // Remove club: delete member record, clear DefaultClubId
                if (existingMember != null)
                {
                    context.Members.Remove(existingMember);
                }
                user.DefaultClubId = null;
                user.DefaultTeamId = null;
            }
            else if (existingMember != null && existingMember.ClubId == request.ClubId.Value)
            {
                // Already in this club, nothing to do
                return NoContent();
            }
            else
            {
                if (existingMember != null)
                {
                    // Move to new club: update existing member
                    existingMember.ClubId = request.ClubId.Value;
                    existingMember.HasClubRoleCoach = false;
                    existingMember.HasClubRoleMainCoach = false;
                    existingMember.HasClubRoleManager = false;
                    existingMember.HasClubRoleSecretary = false;
                }
                else
                {
                    // Create new member record
                    var member = new CoreBusiness.Member
                    {
                        FirstName = user.FirstName?.Trim() ?? string.Empty,
                        LastName = user.LastName?.Trim() ?? string.Empty,
                        Email = user.Email ?? string.Empty,
                        AppUserId = user.Id,
                        ClubId = request.ClubId.Value,
                    };
                    context.Members.Add(member);
                }
                user.DefaultClubId = request.ClubId.Value;
                user.DefaultTeamId = null;
            }

            await userManager.UpdateAsync(user);
            await context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var result = await userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            return NoContent();
        }
    }
}
