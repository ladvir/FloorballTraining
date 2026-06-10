using System.Security.Claims;
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
    [Authorize]
    public class UsersController(
        UserManager<AppUser> userManager,
        FloorballTrainingContext context,
        IClubRoleService clubRoleService,
        ICredentialsEmailService credentialsEmailService,
        IAuditService auditService,
        ILogger<UsersController> logger) : BaseApiController
    {
        private async Task<List<UserClubMembershipInfo>> GetUserClubMemberships(string userId)
        {
            var members = await context.Members
                .Include(m => m.Club)
                .Where(m => m.AppUserId == userId && m.Club != null)
                .ToListAsync();

            var isAdmin = (await userManager.GetRolesAsync(
                (await userManager.FindByIdAsync(userId))!)).Contains("Admin");

            return members.Select(m => new UserClubMembershipInfo
            {
                ClubId = m.ClubId,
                ClubName = m.Club!.Name,
                MemberId = m.Id,
                EffectiveRole = isAdmin ? "Admin"
                    : m.HasClubRoleClubAdmin ? "ClubAdmin"
                    : m.HasClubRoleMainCoach ? "HeadCoach"
                    : m.HasClubRoleCoach ? "Coach"
                    : "User",
            }).ToList();
        }

        // GET /users — Coach+ sees own club members, Admin sees active club
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            var isAdmin = callerRole.EffectiveRole == "Admin";
            var isCoachPlus = isAdmin
                || callerRole.EffectiveRole is "Coach" or "HeadCoach";

            if (!isCoachPlus)
                return Forbid();

            var users = await userManager.Users.ToListAsync();
            var result = new List<UserDto>();

            foreach (var user in users)
            {
                var roles = await userManager.GetRolesAsync(user);

                var members = await context.Members
                    .Include(m => m.Club)
                    .Where(m => m.AppUserId == user.Id)
                    .ToListAsync();

                // Filter by caller's active club
                if (callerRole.ClubId.HasValue && !members.Any(m => m.ClubId == callerRole.ClubId))
                    continue;

                var roleInfo = await clubRoleService.GetUserClubRoleAsync(user.Id, callerRole.ClubId);

                var activeMember = members.FirstOrDefault(m => m.ClubId == callerRole.ClubId)
                    ?? members.FirstOrDefault();

                var clubMemberships = isAdmin ? await GetUserClubMemberships(user.Id) : [];

                result.Add(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Roles = roles,
                    EffectiveRole = roleInfo.EffectiveRole,
                    ClubName = activeMember?.Club?.Name,
                    ClubId = activeMember?.ClubId,
                    MemberId = activeMember?.Id,
                    ClubMemberships = clubMemberships,
                    LastLoginAt = user.LastLoginAt,
                });
            }
            return Ok(result);
        }

        // GET /users/recent-logins?days=7 — Admin only. Users who logged in within the window.
        [HttpGet("recent-logins")]
        public async Task<ActionResult<IEnumerable<RecentLoginDto>>> GetRecentLogins([FromQuery] int days = 7)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();
            if (callerRole.EffectiveRole != "Admin")
                return Forbid();

            if (days < 1) days = 1;
            if (days > 365) days = 365;

            var threshold = DateTime.UtcNow.AddDays(-days);
            var users = await userManager.Users
                .Where(u => u.LastLoginAt != null && u.LastLoginAt >= threshold)
                .OrderByDescending(u => u.LastLoginAt)
                .ToListAsync();

            var result = users.Select(u => new RecentLoginDto
            {
                Id = u.Id,
                Email = u.Email!,
                FirstName = u.FirstName,
                LastName = u.LastName,
                LastLoginAt = u.LastLoginAt!.Value,
            });
            return Ok(result);
        }

        // POST /users — Coach+ creates in own active club; Admin/ClubAdmin can assign broader roles
        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            var isAdmin = callerRole.EffectiveRole == "Admin";
            var isClubAdmin = callerRole.EffectiveRole == "ClubAdmin";
            var isHeadCoach = callerRole.EffectiveRole == "HeadCoach";
            var isCoach = callerRole.EffectiveRole == "Coach";
            var isCoachPlus = isAdmin || isClubAdmin || isHeadCoach || isCoach;

            if (!isCoachPlus)
                return Forbid();

            int? targetClubId;
            if (isAdmin && request.ClubId.HasValue)
                targetClubId = request.ClubId.Value;
            else
                targetClubId = callerRole.ClubId;

            if (targetClubId == null)
                return BadRequest("Nemáte aktivní klub.");

            var club = await context.Clubs.FindAsync(targetClubId.Value);
            if (club == null) return BadRequest("Klub neexistuje.");

            var requestedRole = request.Role ?? "User";
            if (!isAdmin && requestedRole == "Admin")
                return Forbid();
            if (!isAdmin && !isClubAdmin && requestedRole == "ClubAdmin")
                return Forbid();
            if (isCoach && requestedRole is "HeadCoach")
                return BadRequest("Trenér nemůže přiřadit roli Hlavní trenér.");

            if (await userManager.FindByEmailAsync(request.Email) != null)
                return BadRequest("Email je již registrován.");

            var user = new AppUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                DefaultClubId = targetClubId.Value,
            };

            var createResult = await userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
                return BadRequest(createResult.Errors.Select(e => e.Description));

            var identityRole = requestedRole == "Admin" ? "Admin" : "User";
            await userManager.AddToRoleAsync(user, identityRole);

            var member = new CoreBusiness.Member
            {
                FirstName = request.FirstName?.Trim() ?? string.Empty,
                LastName = request.LastName?.Trim() ?? string.Empty,
                Email = request.Email,
                AppUserId = user.Id,
                ClubId = targetClubId.Value,
                HasClubRoleClubAdmin = requestedRole == "ClubAdmin",
                HasClubRoleCoach = requestedRole is "Coach" or "HeadCoach",
                HasClubRoleMainCoach = requestedRole == "HeadCoach",
            };
            context.Members.Add(member);
            await context.SaveChangesAsync();

            if (request.SendCredentialsEmail)
            {
                try
                {
                    await credentialsEmailService.SendWelcomeAsync(request.Email, request.FirstName, request.Password);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to send credentials email after creating user {Email}", request.Email);
                }
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
                ClubName = club.Name,
                ClubId = club.Id,
                MemberId = member.Id,
                ClubMemberships = [new UserClubMembershipInfo
                {
                    ClubId = club.Id, ClubName = club.Name,
                    MemberId = member.Id, EffectiveRole = roleInfo.EffectiveRole,
                }],
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(string id)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            var isAdmin = callerRole.EffectiveRole == "Admin";
            var isCoachPlus = isAdmin
                || callerRole.EffectiveRole is "Coach" or "HeadCoach";

            if (!isCoachPlus)
                return Forbid();

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var member = await context.Members
                .Include(m => m.Club)
                .FirstOrDefaultAsync(m => m.AppUserId == user.Id
                    && (!callerRole.ClubId.HasValue || m.ClubId == callerRole.ClubId));

            if (callerRole.ClubId.HasValue && member == null)
                return NotFound();

            var roles = await userManager.GetRolesAsync(user);
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(user.Id, callerRole.ClubId);
            var clubMemberships = isAdmin ? await GetUserClubMemberships(user.Id) : [];

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
                ClubMemberships = clubMemberships,
                LastLoginAt = user.LastLoginAt,
            };
        }

        // PUT /users/{id}/role — HeadCoach+ / ClubAdmin manage roles in own club, Admin anywhere
        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(string id, UpdateUserRoleRequest request)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            var isAdmin = callerRole.EffectiveRole == "Admin";
            var isClubAdmin = callerRole.EffectiveRole == "ClubAdmin";
            var isHeadCoachPlus = isAdmin || isClubAdmin || callerRole.EffectiveRole == "HeadCoach";

            if (!isHeadCoachPlus)
                return Forbid();

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            if (!isAdmin)
            {
                var targetMember = await context.Members
                    .FirstOrDefaultAsync(m => m.AppUserId == id && m.ClubId == callerRole.ClubId);
                if (targetMember == null)
                    return NotFound();
            }

            if (request.Role == "Admin" && !isAdmin)
                return Forbid();
            if (request.Role == "ClubAdmin" && !isAdmin && !isClubAdmin)
                return Forbid();

            if (request.Role is "Admin" or "User")
            {
                var currentRoles = await userManager.GetRolesAsync(user);
                await userManager.RemoveFromRolesAsync(user, currentRoles);
                var result = await userManager.AddToRoleAsync(user, request.Role);
                if (!result.Succeeded)
                    return BadRequest(result.Errors.Select(e => e.Description));

                if (request.Role == "User")
                {
                    var clubId = isAdmin ? (user.DefaultClubId ?? callerRole.ClubId) : callerRole.ClubId;
                    var member = await context.Members
                        .FirstOrDefaultAsync(m => m.AppUserId == id && m.ClubId == clubId);
                    if (member != null)
                    {
                        member.HasClubRoleClubAdmin = false;
                        member.HasClubRoleCoach = false;
                        member.HasClubRoleMainCoach = false;
                        await context.SaveChangesAsync();
                    }
                }

                await auditService.LogAsync(AuditActions.RoleChanged, "User", id,
                    details: new { newRole = request.Role, target = user.Email });
                return NoContent();
            }

            if (request.Role is "ClubAdmin" or "HeadCoach" or "Coach")
            {
                var clubId = isAdmin ? (user.DefaultClubId ?? callerRole.ClubId) : callerRole.ClubId;
                var member = await context.Members
                    .FirstOrDefaultAsync(m => m.AppUserId == id && m.ClubId == clubId);
                if (member == null)
                    return BadRequest("Uživatel nemá členství v tomto klubu.");

                member.HasClubRoleClubAdmin = request.Role == "ClubAdmin";
                member.HasClubRoleCoach = request.Role is "Coach" or "HeadCoach";
                member.HasClubRoleMainCoach = request.Role == "HeadCoach";
                await context.SaveChangesAsync();

                var currentRoles = await userManager.GetRolesAsync(user);
                if (!currentRoles.Contains("User"))
                {
                    await userManager.RemoveFromRolesAsync(user, currentRoles);
                    await userManager.AddToRoleAsync(user, "User");
                }

                await auditService.LogAsync(AuditActions.RoleChanged, "User", id,
                    details: new { newRole = request.Role, clubId, target = user.Email });
                return NoContent();
            }

            return BadRequest("Neplatná role.");
        }

        // POST /users/{id}/clubs — Admin: any club; ClubAdmin: own club only
        [HttpPost("{id}/clubs")]
        public async Task<IActionResult> AddClub(string id, [FromBody] AddUserToClubRequest request)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            var isAdmin = callerRole.EffectiveRole == "Admin";
            var isClubAdmin = callerRole.EffectiveRole == "ClubAdmin";
            if (!isAdmin && !isClubAdmin)
                return Forbid();
            if (isClubAdmin && request.ClubId != callerRole.ClubId)
                return Forbid();

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var club = await context.Clubs.FindAsync(request.ClubId);
            if (club == null) return BadRequest("Klub neexistuje.");

            // Check for existing member — either linked to this user or unlinked with same email
            var existing = await context.Members
                .FirstOrDefaultAsync(m => m.ClubId == request.ClubId
                    && (m.AppUserId == id || (m.AppUserId == null && m.Email == user.Email)));

            if (existing != null)
            {
                if (existing.AppUserId == null)
                {
                    // Link existing unlinked member to this user
                    existing.AppUserId = user.Id;
                    await context.SaveChangesAsync();
                    var existingEffectiveRole = existing.HasClubRoleClubAdmin ? "ClubAdmin"
                        : existing.HasClubRoleMainCoach ? "HeadCoach"
                        : existing.HasClubRoleCoach ? "Coach" : "User";
                    return Ok(new UserClubMembershipInfo
                    {
                        ClubId = club.Id,
                        ClubName = club.Name,
                        MemberId = existing.Id,
                        EffectiveRole = existingEffectiveRole,
                    });
                }
                return BadRequest("Uživatel je již členem tohoto klubu.");
            }

            var member = new CoreBusiness.Member
            {
                FirstName = user.FirstName?.Trim() ?? string.Empty,
                LastName = user.LastName?.Trim() ?? string.Empty,
                Email = user.Email ?? string.Empty,
                AppUserId = user.Id,
                ClubId = request.ClubId,
            };
            context.Members.Add(member);
            await context.SaveChangesAsync();

            return Ok(new UserClubMembershipInfo
            {
                ClubId = club.Id,
                ClubName = club.Name,
                MemberId = member.Id,
                EffectiveRole = "User",
            });
        }

        // DELETE /users/{id}/clubs/{clubId} — Admin: any club; ClubAdmin: own club only
        [HttpDelete("{id}/clubs/{clubId:int}")]
        public async Task<IActionResult> RemoveClub(string id, int clubId)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            var isAdmin = callerRole.EffectiveRole == "Admin";
            var isClubAdmin = callerRole.EffectiveRole == "ClubAdmin";
            if (!isAdmin && !isClubAdmin)
                return Forbid();
            if (isClubAdmin && clubId != callerRole.ClubId)
                return Forbid();

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var member = await context.Members
                .FirstOrDefaultAsync(m => m.AppUserId == id && m.ClubId == clubId);
            if (member == null) return NotFound("Uživatel není členem tohoto klubu.");

            // Remove team memberships for this member
            var teamMembers = await context.TeamMembers
                .Where(tm => tm.MemberId == member.Id)
                .ToListAsync();
            context.TeamMembers.RemoveRange(teamMembers);

            context.Members.Remove(member);

            // If removing the user's default club, switch to another or null
            if (user.DefaultClubId == clubId)
            {
                var otherMember = await context.Members
                    .FirstOrDefaultAsync(m => m.AppUserId == id && m.ClubId != clubId);
                user.DefaultClubId = otherMember?.ClubId;
                user.DefaultTeamId = null;
                await userManager.UpdateAsync(user);
            }

            await context.SaveChangesAsync();
            await auditService.LogAsync(AuditActions.UserClubMembershipRemoved, "User", id,
                details: new { clubId, target = user.Email });
            return NoContent();
        }

        // PUT /users/{id}/club — Admin only (legacy: set single club)
        [HttpPut("{id}/club")]
        public async Task<IActionResult> UpdateClub(string id, [FromBody] UpdateUserClubRequest request)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            if (callerRole.EffectiveRole != "Admin")
                return Forbid();

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            if (request.ClubId.HasValue)
            {
                var club = await context.Clubs.FindAsync(request.ClubId.Value);
                if (club == null) return BadRequest("Klub neexistuje.");
            }

            var existingMember = await context.Members
                .FirstOrDefaultAsync(m => m.AppUserId == id);

            if (request.ClubId == null)
            {
                if (existingMember != null)
                    context.Members.Remove(existingMember);
                user.DefaultClubId = null;
                user.DefaultTeamId = null;
            }
            else if (existingMember != null && existingMember.ClubId == request.ClubId.Value)
            {
                return NoContent();
            }
            else
            {
                if (existingMember != null)
                {
                    existingMember.ClubId = request.ClubId.Value;
                    existingMember.HasClubRoleClubAdmin = false;
                    existingMember.HasClubRoleCoach = false;
                    existingMember.HasClubRoleMainCoach = false;
                }
                else
                {
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

        // PUT /users/{id}/password — Admin sets a new password directly (no email).
        [HttpPut("{id}/password")]
        public async Task<IActionResult> SetPassword(string id, [FromBody] SetPasswordRequest request)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            if (callerRole.EffectiveRole != "Admin")
                return Forbid();

            if (string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest("Heslo nesmí být prázdné.");

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
            if (!resetResult.Succeeded)
                return BadRequest(new { message = string.Join("; ", resetResult.Errors.Select(e => e.Description)) });

            return Ok(new { message = "Heslo bylo nastaveno." });
        }

        // POST /users/{id}/send-credentials — Admin or ClubAdmin (own club only).
        // Resets the user's password to a new generated one and emails it with instructions.
        [HttpPost("{id}/send-credentials")]
        public async Task<IActionResult> SendCredentials(string id)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            var isAdmin = callerRole.EffectiveRole == "Admin";
            var isClubAdmin = callerRole.EffectiveRole == "ClubAdmin";
            if (!isAdmin && !isClubAdmin)
                return Forbid();

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            if (string.IsNullOrEmpty(user.Email))
                return BadRequest("Uživatel nemá nastavený email.");

            if (!isAdmin)
            {
                var sharesClub = await context.Members
                    .AnyAsync(m => m.AppUserId == id && m.ClubId == callerRole.ClubId);
                if (!sharesClub)
                    return Forbid();
            }

            var newPassword = GenerateTemporaryPassword();
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await userManager.ResetPasswordAsync(user, resetToken, newPassword);
            if (!resetResult.Succeeded)
                return BadRequest(resetResult.Errors.Select(e => e.Description));

            try
            {
                await credentialsEmailService.SendPasswordResetAsync(user.Email, user.FirstName, newPassword);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send credentials email to existing user {Email}", user.Email);
                return StatusCode(500, new { message = "Heslo bylo resetováno, ale email se nepodařilo odeslat." });
            }

            return Ok(new { message = "Heslo bylo resetováno a odesláno emailem." });
        }

        private static string GenerateTemporaryPassword()
        {
            const string lower = "abcdefghijkmnopqrstuvwxyz";
            const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
            const string digits = "23456789";
            const string special = "!@#$%&*";
            var all = lower + upper + digits + special;
            var rng = System.Security.Cryptography.RandomNumberGenerator.Create();

            char Pick(string source)
            {
                var bytes = new byte[4];
                rng.GetBytes(bytes);
                var index = (int)(BitConverter.ToUInt32(bytes, 0) % (uint)source.Length);
                return source[index];
            }

            var chars = new List<char>
            {
                Pick(lower), Pick(upper), Pick(digits), Pick(special),
            };
            for (var i = 0; i < 8; i++) chars.Add(Pick(all));

            // Fisher-Yates shuffle
            for (var i = chars.Count - 1; i > 0; i--)
            {
                var bytes = new byte[4];
                rng.GetBytes(bytes);
                var j = (int)(BitConverter.ToUInt32(bytes, 0) % (uint)(i + 1));
                (chars[i], chars[j]) = (chars[j], chars[i]);
            }
            return new string(chars.ToArray());
        }

        // DELETE /users/{id} — Admin only
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var (caller, callerRole, _) = await GetCallerInfoAsync();
            if (caller == null) return Unauthorized();

            if (callerRole.EffectiveRole != "Admin")
                return Forbid();

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var deletedEmail = user.Email;
            var result = await userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            await auditService.LogAsync(AuditActions.UserDeleted, "User", id,
                details: new { target = deletedEmail });
            return NoContent();
        }

        private async Task<(AppUser? caller, ClubRoleInfo roleInfo, IList<string> roles)> GetCallerInfoAsync()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (email == null) return (null, new ClubRoleInfo("User", null, []), []);

            var caller = await userManager.FindByEmailAsync(email);
            if (caller == null) return (null, new ClubRoleInfo("User", null, []), []);

            var roles = await userManager.GetRolesAsync(caller);
            var roleInfo = await clubRoleService.GetUserClubRoleAsync(caller.Id);
            return (caller, roleInfo, roles);
        }
    }
}
