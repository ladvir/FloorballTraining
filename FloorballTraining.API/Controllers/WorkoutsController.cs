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
        if (!await IsCoachOrAbove(userId))
            return Forbid();

        if (!await context.Members.AnyAsync(m => m.Id == memberId))
            return NotFound();

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

        var workout = await context.IndividualWorkouts
            .FirstOrDefaultAsync(w => w.Id == id && w.MemberId == memberId);
        if (workout == null) return NotFound();

        var isCoach = await IsCoachOrAbove(userId);
        var isOwner = await IsMemberOwner(memberId, userId);

        if (!isCoach && !isOwner)
            return Forbid();

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
        if (!await IsCoachOrAbove(userId))
            return Forbid();

        if (dto.MemberIds.Count == 0)
            return BadRequest("Vyberte alespoň jednoho člena.");

        var validIds = await context.Members
            .Where(m => dto.MemberIds.Contains(m.Id))
            .Select(m => m.Id)
            .ToListAsync();

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

        // Notify each member that has an app account
        var appUserIds = await context.Members
            .Where(m => validIds.Contains(m.Id) && m.AppUserId != null)
            .Select(m => m.AppUserId!)
            .ToListAsync();
        foreach (var appUserId in appUserIds)
        {
            await notificationService.CreateForUserAsync(
                appUserId,
                "workout_assigned",
                "Nové cvičení",
                $"Bylo ti přiřazeno týmové cvičení: {dto.Title}"
            );
        }

        return Ok(new { created = workouts.Count });
    }

    // DELETE /members/{memberId}/workouts/{id}  — Coach+ only
    [HttpDelete("/members/{memberId:int}/workouts/{id:int}")]
    public async Task<IActionResult> Delete(int memberId, int id)
    {
        var userId = CurrentUserId();
        if (!await IsCoachOrAbove(userId))
            return Forbid();

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
        if (await IsCoachOrAbove(userId)) return true;
        return await IsMemberOwner(memberId, userId);
    }

    private async Task<bool> IsCoachOrAbove(string userId)
    {
        if (IsAdmin()) return true;
        var role = await clubRoleService.GetUserClubRoleAsync(userId);
        return role.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin";
    }

    private async Task<bool> IsMemberOwner(int memberId, string userId)
    {
        return await context.Members.AnyAsync(m => m.Id == memberId && m.AppUserId == userId);
    }
}
