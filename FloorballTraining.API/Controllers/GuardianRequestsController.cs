using System.Security.Claims;
using FloorballTraining.API.Dtos.Members;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Parent self-service guardian linking (#113): a parent identifies their child via a
/// coach-issued invite code and files a request; a coach approves or rejects it. Approval
/// creates the same <see cref="MemberGuardian"/> link the coach-invite flow (#102) creates.
/// Mirrors <see cref="RoleRequestsController"/>'s Pending/Approved/Rejected shape.
/// </summary>
public class GuardianRequestsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    GuardianAccountService guardianAccounts,
    ICredentialsEmailService credentialsEmailService,
    IAuditService auditService,
    ILogger<GuardianRequestsController> logger) : BaseApiController
{
    /// <summary>
    /// POST /guardianrequests — parent enters their e-mail and the coach-issued code for their
    /// child. Creates or reuses a login by e-mail (same logic as the coach-invite flow) and files
    /// a Pending request; the parent sees the child only once a coach approves it.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateGuardianRequestRequest request)
    {
        var code = request.Code?.Trim();
        var email = request.Email?.Trim();
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Email a kód jsou povinné." });

        var member = await context.Members.FirstOrDefaultAsync(m => m.GuardianInviteCode == code);
        if (member == null) return BadRequest(new { message = "Neplatný kód." });

        var account = await guardianAccounts.FindOrCreateAsync(email, member.ClubId, request.Language);
        if (account.Error != null) return BadRequest(new { message = account.Error });
        var user = account.User;

        if (await context.MemberGuardians.AnyAsync(g => g.MemberId == member.Id && g.GuardianAppUserId == user.Id))
            return BadRequest(new { message = "Rodič je již propojen s tímto dítětem." });
        if (await context.GuardianRequests.AnyAsync(r =>
                r.MemberId == member.Id && r.GuardianAppUserId == user.Id && r.Status == GuardianRequestStatus.Pending))
            return BadRequest(new { message = "Žádost už čeká na schválení." });

        context.GuardianRequests.Add(new GuardianRequest
        {
            MemberId = member.Id,
            GuardianAppUserId = user.Id,
        });
        await context.SaveChangesAsync();

        var emailSent = false;
        if (account.CreatedNewUser)
        {
            try
            {
                await credentialsEmailService.SendWelcomeAsync(email, user.FirstName, account.GeneratedPassword!);
                emailSent = true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send credentials email after guardian self-request for member {MemberId}", member.Id);
            }
        }

        await auditService.LogAsync(AuditActions.GuardianRequestCreated, "Member", member.Id.ToString(),
            details: new { guardian = email, clubId = member.ClubId });

        return Ok(new { loginCreated = account.CreatedNewUser, emailSent });
    }

    /// <summary>GET /guardianrequests — pending parent requests for the caller's club (Coach+).</summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetPending()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        IQueryable<GuardianRequest> query = context.GuardianRequests
            .Include(r => r.Member)
            .ThenInclude(m => m!.Club)
            .Where(r => r.Status == GuardianRequestStatus.Pending);

        if (roleInfo.EffectiveRole == "Admin")
        {
            // Admin sees all pending requests
        }
        else if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach" && roleInfo.ClubId.HasValue)
        {
            query = query.Where(r => r.Member!.ClubId == roleInfo.ClubId.Value);
        }
        else
        {
            return Forbid();
        }

        // Select the name parts as separate columns and concatenate client-side — see
        // RoleRequestsController.GetPending for why (FirstName/LastName collation mismatch).
        var rows = await query.Select(r => new
        {
            r.Id,
            r.MemberId,
            FirstName = r.Member!.FirstName,
            LastName = r.Member.LastName,
            ClubName = r.Member.Club != null ? r.Member.Club.Name : null,
            r.GuardianAppUserId,
            r.CreatedAt,
        }).ToListAsync();

        var guardianIds = rows.Select(r => r.GuardianAppUserId).Distinct().ToList();
        var guardians = (await context.Users.Where(u => guardianIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Email, u.FirstName, u.LastName })
                .ToListAsync())
            .ToDictionary(u => u.Id);

        var result = rows.Select(r =>
        {
            guardians.TryGetValue(r.GuardianAppUserId, out var g);
            return new GuardianRequestDto
            {
                Id = r.Id,
                MemberId = r.MemberId,
                ChildName = $"{r.FirstName} {r.LastName}",
                ClubName = r.ClubName ?? string.Empty,
                GuardianEmail = g?.Email ?? string.Empty,
                GuardianName = g != null ? $"{g.FirstName} {g.LastName}".Trim() : string.Empty,
                CreatedAt = r.CreatedAt,
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPut("{id:int}/approve")]
    [Authorize]
    public async Task<IActionResult> Approve(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        var request = await context.GuardianRequests.Include(r => r.Member).FirstOrDefaultAsync(r => r.Id == id);
        if (request == null) return NotFound();
        if (request.Status != GuardianRequestStatus.Pending)
            return BadRequest(new { message = "Žádost již byla vyřízena." });

        if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach")
        {
            if (request.Member!.ClubId != roleInfo.ClubId) return Forbid();
        }
        else if (roleInfo.EffectiveRole != "Admin")
        {
            return Forbid();
        }

        if (!await context.MemberGuardians.AnyAsync(g =>
                g.MemberId == request.MemberId && g.GuardianAppUserId == request.GuardianAppUserId))
        {
            context.MemberGuardians.Add(new MemberGuardian
            {
                MemberId = request.MemberId,
                GuardianAppUserId = request.GuardianAppUserId,
                CreatedByUserId = userId,
            });
        }

        request.Status = GuardianRequestStatus.Approved;
        request.ResolvedAt = DateTime.UtcNow;
        request.ResolvedByUserId = userId;
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.GuardianRequestApproved, "Member", request.MemberId.ToString(),
            details: new { guardianUserId = request.GuardianAppUserId });

        return Ok();
    }

    [HttpPut("{id:int}/reject")]
    [Authorize]
    public async Task<IActionResult> Reject(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        var request = await context.GuardianRequests.Include(r => r.Member).FirstOrDefaultAsync(r => r.Id == id);
        if (request == null) return NotFound();
        if (request.Status != GuardianRequestStatus.Pending)
            return BadRequest(new { message = "Žádost již byla vyřízena." });

        if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach")
        {
            if (request.Member!.ClubId != roleInfo.ClubId) return Forbid();
        }
        else if (roleInfo.EffectiveRole != "Admin")
        {
            return Forbid();
        }

        request.Status = GuardianRequestStatus.Rejected;
        request.ResolvedAt = DateTime.UtcNow;
        request.ResolvedByUserId = userId;
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.GuardianRequestRejected, "Member", request.MemberId.ToString(),
            details: new { guardianUserId = request.GuardianAppUserId });

        return Ok();
    }
}
