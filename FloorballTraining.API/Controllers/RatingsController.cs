using System.Security.Claims;
using FloorballTraining.API.Services;
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
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task<string?> GetUserName(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user != null ? $"{user.FirstName} {user.LastName}".Trim() : null;
    }

    /// <summary>
    /// Visibility scope for the current user:
    /// - Admin: sees all ratings across all teams (SeesAll = true)
    /// - HeadCoach: sees ratings for all teams in their active club
    /// - Coach: sees ratings for teams where they are assigned as coach
    /// - User/Player: sees only own ratings within their active club
    /// </summary>
    private sealed record RatingVisibility(bool SeesAll, bool IsCoachOrAbove, List<int> TeamIds);

    private RatingVisibility? _visibility;

    private async Task<RatingVisibility> GetVisibilityAsync()
    {
        if (_visibility != null) return _visibility;

        var userId = GetCurrentUserId()!;

        if (User.IsInRole("Admin"))
            return _visibility = new RatingVisibility(true, true, []);

        var info = await clubRoleService.GetUserClubRoleAsync(userId);

        if (info.EffectiveRole == "HeadCoach" && info.ClubId.HasValue)
        {
            var ids = await context.Teams
                .Where(t => t.ClubId == info.ClubId.Value)
                .Select(t => t.Id)
                .ToListAsync();
            return _visibility = new RatingVisibility(false, true, ids);
        }

        if (info.EffectiveRole == "Coach")
            return _visibility = new RatingVisibility(false, true, info.CoachTeamIds);

        // Regular user: only their active club (for own-rating lookups)
        if (info.ClubId.HasValue)
        {
            var ids = await context.Teams
                .Where(t => t.ClubId == info.ClubId.Value)
                .Select(t => t.Id)
                .ToListAsync();
            return _visibility = new RatingVisibility(false, false, ids);
        }

        return _visibility = new RatingVisibility(false, false, []);
    }

    private static IQueryable<AppointmentRating> FilterByTeams(
        IQueryable<AppointmentRating> query, List<int> teamIds)
    {
        return query.Where(r =>
            r.Appointment != null &&
            r.Appointment.TeamId != null &&
            teamIds.Contains(r.Appointment.TeamId.Value));
    }

    private async Task<RaterType> ResolveRaterType(string userId, Appointment appointment)
    {
        if (appointment.TeamId != null)
        {
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

        var vis = await GetVisibilityAsync();
        return vis.IsCoachOrAbove ? RaterType.Coach : RaterType.Player;
    }

    private async Task<AppointmentRatingDto> ToDto(AppointmentRating r)
    {
        var apt = r.Appointment ?? await context.Appointments.FindAsync(r.AppointmentId);
        var userId = GetCurrentUserId();
        var isOwn = r.UserId == userId;
        var vis = await GetVisibilityAsync();

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
            Comment = isOwn || vis.IsCoachOrAbove ? r.Comment : null,
            RaterType = r.RaterType,
            CreatedAt = r.CreatedAt
        };
    }

    /// <summary>GET /ratings?appointmentId=X — all ratings for an appointment</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? appointmentId)
    {
        var userId = GetCurrentUserId();
        var vis = await GetVisibilityAsync();

        IQueryable<AppointmentRating> query = context.AppointmentRatings
            .Include(r => r.Appointment)
            .OrderByDescending(r => r.CreatedAt);

        if (!vis.SeesAll)
            query = FilterByTeams(query, vis.TeamIds);

        if (appointmentId.HasValue)
            query = query.Where(r => r.AppointmentId == appointmentId.Value);

        // Players only see their own ratings
        if (!vis.IsCoachOrAbove)
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
        var vis = await GetVisibilityAsync();

        IQueryable<AppointmentRating> query = context.AppointmentRatings
            .Include(r => r.Appointment)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt);

        if (!vis.SeesAll)
            query = FilterByTeams(query, vis.TeamIds);

        var ratings = await query.ToListAsync();
        var dtos = new List<AppointmentRatingDto>();
        foreach (var r in ratings)
            dtos.Add(await ToDto(r));

        return Ok(dtos);
    }

    /// <summary>GET /ratings/averages — average grade per appointment</summary>
    [HttpGet("averages")]
    public async Task<IActionResult> GetAverages()
    {
        var vis = await GetVisibilityAsync();

        IQueryable<AppointmentRating> query = context.AppointmentRatings.Include(r => r.Appointment);
        if (!vis.SeesAll)
            query = FilterByTeams(query, vis.TeamIds);

        var averages = await query
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
        var vis = await GetVisibilityAsync();

        IQueryable<AppointmentRating> query = context.AppointmentRatings
            .Include(r => r.Appointment)
            .Where(r => r.UserId == userId);

        if (!vis.SeesAll)
            query = FilterByTeams(query, vis.TeamIds);

        var grades = await query
            .ToDictionaryAsync(r => r.AppointmentId, r => (double)r.Grade);

        return Ok(grades);
    }

    /// <summary>GET /ratings/stats — rating statistics</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var vis = await GetVisibilityAsync();

        IQueryable<AppointmentRating> query = context.AppointmentRatings.Include(r => r.Appointment);
        if (!vis.SeesAll)
            query = FilterByTeams(query, vis.TeamIds);

        var ratings = await query.ToListAsync();

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

        var appointment = await context.Appointments.FindAsync(dto.AppointmentId);
        if (appointment == null) return NotFound("Událost nenalezena.");

        // Verify appointment is visible to this user
        if (appointment.TeamId != null)
        {
            var vis = await GetVisibilityAsync();
            if (!vis.SeesAll && !vis.TeamIds.Contains(appointment.TeamId.Value))
                return NotFound("Událost nenalezena.");
        }

        if (appointment.Start >= DateTime.UtcNow)
            return BadRequest(new { message = "Nelze hodnotit budoucí události." });

        if (dto.Grade < 1 || dto.Grade > 5)
            return BadRequest(new { message = "Známka musí být 1-5." });

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
        var rating = await context.AppointmentRatings
            .Include(r => r.Appointment)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (rating == null) return NotFound();

        // Verify rating's appointment is visible to this user
        if (rating.Appointment?.TeamId != null)
        {
            var vis = await GetVisibilityAsync();
            if (!vis.SeesAll && !vis.TeamIds.Contains(rating.Appointment.TeamId.Value))
                return NotFound();
        }

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
        var rating = await context.AppointmentRatings
            .Include(r => r.Appointment)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (rating == null) return NotFound();

        // Verify rating's appointment is visible to this user
        if (rating.Appointment?.TeamId != null)
        {
            var vis = await GetVisibilityAsync();
            if (!vis.SeesAll && !vis.TeamIds.Contains(rating.Appointment.TeamId.Value))
                return NotFound();
        }

        if (rating.UserId != userId && !User.IsInRole("Admin"))
            return Forbid();

        context.AppointmentRatings.Remove(rating);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
