using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class WorkoutsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    INotificationService notificationService)
    : BaseApiController
{
    private string CurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin");

    // GET /members/{memberId}/workouts
    [HttpGet("/members/{memberId:int}/workouts")]
    public async Task<IActionResult> GetByMember(int memberId)
    {
        var userId = CurrentUserId();
        if (!await CanReadMember(memberId, userId))
            return Forbid();

        var workouts = await context.IndividualWorkouts
            .Where(w => w.MemberId == memberId)
            .OrderByDescending(w => w.AssignedAt)
            .Select(w => new IndividualWorkoutDto
            {
                Id = w.Id,
                MemberId = w.MemberId,
                Title = w.Title,
                Description = w.Description,
                Status = w.Status,
                DueDate = w.DueDate,
                AssignedByUserId = w.AssignedByUserId,
                AssignedAt = w.AssignedAt,
                CompletedAt = w.CompletedAt,
                PlayerNote = w.PlayerNote,
                IsTeamWorkout = w.IsTeamWorkout,
            })
            .ToListAsync();

        return Ok(workouts);
    }

    // POST /members/{memberId}/workouts  — Coach+ only
    [HttpPost("/members/{memberId:int}/workouts")]
    public async Task<IActionResult> Create(int memberId, [FromBody] IndividualWorkoutCreateDto dto)
    {
        var userId = CurrentUserId();
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole is not ("Coach" or "HeadCoach" or "ClubAdmin" or "Admin"))
            return Forbid();

        var memberClub = await context.Members
            .Where(m => m.Id == memberId)
            .Select(m => (int?)m.ClubId)
            .FirstOrDefaultAsync();
        if (memberClub == null) return NotFound();
        if (roleInfo.EffectiveRole != "Admin" && memberClub != roleInfo.ClubId)
            return Forbid();

        var workout = new IndividualWorkout
        {
            MemberId = memberId,
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            Status = 0,
            AssignedByUserId = userId,
            AssignedAt = DateTime.UtcNow,
            IsTeamWorkout = false,
        };

        context.IndividualWorkouts.Add(workout);
        await context.SaveChangesAsync();

        // Notify the member if they have an app account
        var memberAppUserId = await context.Members
            .Where(m => m.Id == memberId && m.AppUserId != null)
            .Select(m => m.AppUserId!)
            .FirstOrDefaultAsync();
        if (memberAppUserId != null)
        {
            await notificationService.CreateForUserAsync(
                memberAppUserId,
                "workout_assigned",
                "Nové cvičení",
                $"Bylo ti přiřazeno individuální cvičení: {workout.Title}"
            );
        }

        return Ok(new IndividualWorkoutDto
        {
            Id = workout.Id,
            MemberId = workout.MemberId,
            Title = workout.Title,
            Description = workout.Description,
            Status = workout.Status,
            DueDate = workout.DueDate,
            AssignedByUserId = workout.AssignedByUserId,
            AssignedAt = workout.AssignedAt,
            CompletedAt = workout.CompletedAt,
            PlayerNote = workout.PlayerNote,
            IsTeamWorkout = workout.IsTeamWorkout,
        });
    }

    // PUT /members/{memberId}/workouts/{id}  — Coach (full edit) or the member's linked user (status only)
    [HttpPut("/members/{memberId:int}/workouts/{id:int}")]
    public async Task<IActionResult> UpdateStatus(int memberId, int id, [FromBody] IndividualWorkoutStatusDto dto)
    {
        var userId = CurrentUserId();
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        var isCoach = roleInfo.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin" or "Admin";
        var isOwner = await IsMemberOwner(memberId, userId);

        if (!isCoach && !isOwner)
            return Forbid();

        // Players may only mark as completed (1) or skipped (2); resetting to assigned (0) is coach-only.
        if (!isCoach && isOwner && dto.Status == 0)
            return Forbid();

        var workout = await context.IndividualWorkouts
            .FirstOrDefaultAsync(w => w.Id == id && w.MemberId == memberId);
        if (workout == null) return NotFound();

        // Coaches must be in the same club as the member.
        if (isCoach && roleInfo.EffectiveRole != "Admin")
        {
            var memberClubId = await context.Members
                .Where(m => m.Id == memberId)
                .Select(m => (int?)m.ClubId)
                .FirstOrDefaultAsync();
            if (memberClubId != roleInfo.ClubId) return Forbid();
        }

        workout.Status = dto.Status;
        workout.PlayerNote = dto.PlayerNote;
        if (dto.Status == 1)
            workout.CompletedAt = DateTime.UtcNow;
        else
            workout.CompletedAt = null;

        await context.SaveChangesAsync();
        return NoContent();
    }

    // POST /workouts/bulk  — Coach+ only; creates one workout per member
    [HttpPost("/workouts/bulk")]
    public async Task<IActionResult> CreateBulk([FromBody] BulkWorkoutCreateDto dto)
    {
        var userId = CurrentUserId();
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole is not ("Coach" or "HeadCoach" or "ClubAdmin" or "Admin"))
            return Forbid();

        if (dto.MemberIds.Count == 0)
            return BadRequest("Vyberte alespoň jednoho člena.");

        if (dto.MemberIds.Count > 500)
            return BadRequest("Hromadné přiřazení je omezeno na 500 členů najednou.");

        if (roleInfo.EffectiveRole != "Admin" && !roleInfo.ClubId.HasValue)
            return Forbid();

        var membersQuery = context.Members.Where(m => dto.MemberIds.Contains(m.Id));
        if (roleInfo.EffectiveRole != "Admin")
            membersQuery = membersQuery.Where(m => m.ClubId == roleInfo.ClubId!.Value);
        var validIds = await membersQuery.Select(m => m.Id).ToListAsync();

        var now = DateTime.UtcNow;
        var workouts = validIds.Select(memberId => new IndividualWorkout
        {
            MemberId = memberId,
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            Status = 0,
            AssignedByUserId = userId,
            AssignedAt = now,
            IsTeamWorkout = true,
        }).ToList();

        context.IndividualWorkouts.AddRange(workouts);
        await context.SaveChangesAsync();

        // Notify each member that has an app account (fire in parallel)
        var appUserIds = await context.Members
            .Where(m => validIds.Contains(m.Id) && m.AppUserId != null)
            .Select(m => m.AppUserId!)
            .ToListAsync();
        try
        {
            await Task.WhenAll(appUserIds.Select(uid => notificationService.CreateForUserAsync(
                uid,
                "workout_assigned",
                "Nové cvičení",
                $"Bylo ti přiřazeno týmové cvičení: {dto.Title}"
            )));
        }
        catch (Exception ex)
        {
            HttpContext.RequestServices
                .GetRequiredService<ILogger<WorkoutsController>>()
                .LogWarning(ex, "Bulk workout notification failed (workouts already saved)");
        }

        return Ok(new { created = workouts.Count });
    }

    // DELETE /members/{memberId}/workouts/{id}  — Coach+ only
    [HttpDelete("/members/{memberId:int}/workouts/{id:int}")]
    public async Task<IActionResult> Delete(int memberId, int id)
    {
        var userId = CurrentUserId();
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole is not ("Coach" or "HeadCoach" or "ClubAdmin" or "Admin"))
            return Forbid();

        if (roleInfo.EffectiveRole != "Admin")
        {
            var memberClubId = await context.Members
                .Where(m => m.Id == memberId)
                .Select(m => (int?)m.ClubId)
                .FirstOrDefaultAsync();
            if (memberClubId != roleInfo.ClubId) return Forbid();
        }

        var workout = await context.IndividualWorkouts
            .FirstOrDefaultAsync(w => w.Id == id && w.MemberId == memberId);
        if (workout == null) return NotFound();

        context.IndividualWorkouts.Remove(workout);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> CanReadMember(int memberId, string userId)
    {
        if (IsAdmin()) return true;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin")
        {
            var memberClubId = await context.Members
                .Where(m => m.Id == memberId)
                .Select(m => (int?)m.ClubId)
                .FirstOrDefaultAsync();
            return memberClubId != null && memberClubId == roleInfo.ClubId;
        }
        return await IsMemberOwner(memberId, userId);
    }

    private async Task<bool> IsMemberOwner(int memberId, string userId)
    {
        return await context.Members.AnyAsync(m => m.Id == memberId && m.AppUserId == userId);
    }
}
