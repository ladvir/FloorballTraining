using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class RoleRequestsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetPending()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        IQueryable<RoleRequest> query = context.RoleRequests
            .Include(r => r.Member)
            .ThenInclude(m => m!.Club)
            .Where(r => r.Status == RoleRequestStatus.Pending);

        if (roleInfo.EffectiveRole == "Admin")
        {
            // Admin sees all pending requests
        }
        else if (roleInfo.EffectiveRole == "HeadCoach" && roleInfo.ClubId.HasValue)
        {
            query = query.Where(r => r.Member!.ClubId == roleInfo.ClubId.Value);
        }
        else
        {
            return Forbid();
        }

        var requests = await query.Select(r => new
        {
            r.Id,
            r.MemberId,
            MemberName = r.Member!.FirstName + " " + r.Member.LastName,
            MemberEmail = r.Member.Email,
            ClubName = r.Member.Club != null ? r.Member.Club.Name : null,
            r.RequestedRole,
            r.Status,
            r.CreatedAt
        }).ToListAsync();

        return Ok(requests);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        var request = await context.RoleRequests
            .Include(r => r.Member)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null) return NotFound();
        if (request.Status != RoleRequestStatus.Pending)
            return BadRequest("Žádost již byla vyřízena");

        if (roleInfo.EffectiveRole == "HeadCoach")
        {
            if (request.Member!.ClubId != roleInfo.ClubId)
                return Forbid();
            if (request.RequestedRole == "HeadCoach")
                return BadRequest("Hlavní trenér nemůže schválit roli hlavního trenéra");
        }
        else if (roleInfo.EffectiveRole != "Admin")
        {
            return Forbid();
        }

        // Apply the role to the member
        switch (request.RequestedRole)
        {
            case "Coach":
                request.Member!.HasClubRoleCoach = true;
                break;
            case "HeadCoach":
                request.Member!.HasClubRoleMainCoach = true;
                request.Member.HasClubRoleCoach = true;
                break;
        }

        request.Status = RoleRequestStatus.Approved;
        request.ResolvedAt = DateTime.UtcNow;
        request.ResolvedByUserId = userId;

        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        var request = await context.RoleRequests
            .Include(r => r.Member)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null) return NotFound();
        if (request.Status != RoleRequestStatus.Pending)
            return BadRequest("Žádost již byla vyřízena");

        if (roleInfo.EffectiveRole == "HeadCoach")
        {
            if (request.Member!.ClubId != roleInfo.ClubId)
                return Forbid();
        }
        else if (roleInfo.EffectiveRole != "Admin")
        {
            return Forbid();
        }

        request.Status = RoleRequestStatus.Rejected;
        request.ResolvedAt = DateTime.UtcNow;
        request.ResolvedByUserId = userId;

        await context.SaveChangesAsync();
        return Ok();
    }
}
