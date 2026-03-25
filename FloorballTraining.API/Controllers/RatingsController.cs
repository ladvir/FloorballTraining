using System.Security.Claims;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class RatingsController(
    FloorballTrainingContext context,
    UserManager<AppUser> userManager)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task<string?> GetUserName(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user != null ? $"{user.FirstName} {user.LastName}".Trim() : null;
    }

    private async Task<RaterType> ResolveRaterType(string userId, Appointment appointment)
    {
        if (appointment.TeamId != null)
        {
            // Look up the user's TeamMember record for this team
            var member = await context.Members.FirstOrDefaultAsync(m => m.AppUserId == userId);
            if (member != null)
            {
                var teamMember = await context.TeamMembers
                    .FirstOrDefaultAsync(tm => tm.MemberId == member.Id && tm.TeamId == appointment.TeamId);
                if (teamMember is { IsCoach: true })
                    return RaterType.Coach;
                if (teamMember is { IsPlayer: true })
                    return RaterType.Player;
            }
        }

        // Fallback: derive from app role
        return User.IsInRole("Admin") || User.IsInRole("HeadCoach") || User.IsInRole("Coach")
            ? RaterType.Coach
            : RaterType.Player;
    }

    private bool IsCoachOrAbove() =>
        User.IsInRole("Admin") || User.IsInRole("HeadCoach") || User.IsInRole("Coach");

    private async Task<AppointmentRatingDto> ToDto(AppointmentRating r)
    {
        var apt = r.Appointment ?? await context.Appointments.FindAsync(r.AppointmentId);
        var userId = GetCurrentUserId();
        var isOwn = r.UserId == userId;

        string? teamName = null;
        if (apt?.TeamId != null)
        {
            var team = await context.Teams.FindAsync(apt.TeamId);
            teamName = team?.Name;
        }

        string? trainingName = null;
        if (apt?.TrainingId != null)
        {
            var training = await context.Trainings.FindAsync(apt.TrainingId);
            trainingName = training?.Name;
        }

        return new AppointmentRatingDto
        {
            Id = r.Id,
            AppointmentId = r.AppointmentId,
            AppointmentName = apt?.Name,
            AppointmentStart = apt?.Start,
            AppointmentType = apt != null ? (int)apt.AppointmentType : null,
            TeamId = apt?.TeamId,
            TeamName = teamName,
            TrainingName = trainingName,
            UserId = r.UserId,
            UserName = await GetUserName(r.UserId),
            Grade = r.Grade,
            // Players only see their own comments; coaches/admins see all
            Comment = isOwn || IsCoachOrAbove() ? r.Comment : null,
            RaterType = r.RaterType,
            CreatedAt = r.CreatedAt
        };
    }

    /// <summary>GET /ratings?appointmentId=X — all ratings for an appointment</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? appointmentId)
    {
        var userId = GetCurrentUserId();
        IQueryable<AppointmentRating> query = context.AppointmentRatings
            .Include(r => r.Appointment)
            .OrderByDescending(r => r.CreatedAt);

        if (appointmentId.HasValue)
            query = query.Where(r => r.AppointmentId == appointmentId.Value);

        // Players only see their own ratings
        if (!IsCoachOrAbove())
            query = query.Where(r => r.UserId == userId);

        var ratings = await query.ToListAsync();
        var dtos = new List<AppointmentRatingDto>();
        foreach (var r in ratings)
            dtos.Add(await ToDto(r));

        return Ok(dtos);
    }

    /// <summary>GET /ratings/my — current user's ratings</summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyRatings()
    {
        var userId = GetCurrentUserId();
        var ratings = await context.AppointmentRatings
            .Include(r => r.Appointment)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var dtos = new List<AppointmentRatingDto>();
        foreach (var r in ratings)
            dtos.Add(await ToDto(r));

        return Ok(dtos);
    }

    /// <summary>GET /ratings/averages — average grade per appointment (only rated ones)</summary>
    [HttpGet("averages")]
    public async Task<IActionResult> GetAverages()
    {
        var averages = await context.AppointmentRatings
            .GroupBy(r => r.AppointmentId)
            .Select(g => new { AppointmentId = g.Key, Average = Math.Round(g.Average(r => r.Grade), 1) })
            .ToDictionaryAsync(x => x.AppointmentId, x => x.Average);

        return Ok(averages);
    }

    /// <summary>GET /ratings/my-grades — current user's grades per appointment</summary>
    [HttpGet("my-grades")]
    public async Task<IActionResult> GetMyGrades()
    {
        var userId = GetCurrentUserId();
        var grades = await context.AppointmentRatings
            .Where(r => r.UserId == userId)
            .ToDictionaryAsync(r => r.AppointmentId, r => (double)r.Grade);

        return Ok(grades);
    }

    /// <summary>GET /ratings/stats — rating statistics</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var ratings = await context.AppointmentRatings.ToListAsync();

        if (ratings.Count == 0)
            return Ok(new RatingStatsDto());

        var stats = new RatingStatsDto
        {
            TotalRatings = ratings.Count,
            AverageGrade = Math.Round(ratings.Average(r => r.Grade), 2),
            RatedAppointments = ratings.Select(r => r.AppointmentId).Distinct().Count(),
            CoachRatings = ratings.Count(r => r.RaterType == RaterType.Coach),
            PlayerRatings = ratings.Count(r => r.RaterType == RaterType.Player),
        };

        for (var i = 0; i < 5; i++)
            stats.GradeDistribution[i] = ratings.Count(r => r.Grade == i + 1);

        return Ok(stats);
    }

    /// <summary>POST /ratings</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AppointmentRatingDto dto)
    {
        var userId = GetCurrentUserId()!;

        // Validate appointment exists
        var appointment = await context.Appointments.FindAsync(dto.AppointmentId);
        if (appointment == null) return NotFound("Událost nenalezena.");

        // Only past events can be rated
        if (appointment.Start >= DateTime.UtcNow)
            return BadRequest(new { message = "Nelze hodnotit budoucí události." });

        // Validate grade 1-5
        if (dto.Grade < 1 || dto.Grade > 5)
            return BadRequest(new { message = "Známka musí být 1-5." });

        // Check if user already rated this appointment
        var existing = await context.AppointmentRatings
            .FirstOrDefaultAsync(r => r.AppointmentId == dto.AppointmentId && r.UserId == userId);
        if (existing != null)
            return BadRequest(new { message = "Tuto událost jste již hodnotili." });

        var raterType = await ResolveRaterType(userId, appointment);

        var rating = new AppointmentRating
        {
            AppointmentId = dto.AppointmentId,
            UserId = userId,
            Grade = dto.Grade,
            Comment = dto.Comment,
            RaterType = raterType,
            CreatedAt = DateTime.UtcNow
        };

        context.AppointmentRatings.Add(rating);
        await context.SaveChangesAsync();

        return Ok(await ToDto(rating));
    }

    /// <summary>PUT /ratings/{id}</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AppointmentRatingDto dto)
    {
        var userId = GetCurrentUserId()!;
        var rating = await context.AppointmentRatings.FindAsync(id);
        if (rating == null) return NotFound();

        // Only the author can update
        if (rating.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        if (dto.Grade < 1 || dto.Grade > 5)
            return BadRequest(new { message = "Známka musí být 1-5." });

        rating.Grade = dto.Grade;
        rating.Comment = dto.Comment;

        await context.SaveChangesAsync();
        return Ok(await ToDto(rating));
    }

    /// <summary>DELETE /ratings/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetCurrentUserId()!;
        var rating = await context.AppointmentRatings.FindAsync(id);
        if (rating == null) return NotFound();

        if (rating.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        context.AppointmentRatings.Remove(rating);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
