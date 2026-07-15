using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Season periodization plan of a team: mesocycles (training blocks with a phase and goals)
/// containing microcycles (typically weeks, with a load type and goals). Cycle dates are
/// date-only, inclusive on both ends. See docs and issues #61-#67.
/// </summary>
[Authorize]
public class SeasonPlanController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService) : BaseApiController
{
    private const int MaxGoalTags = 3;

    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsAdmin() => User.IsInRole("Admin");

    // ── Authorization helpers ────────────────────────────────────────────────

    private async Task<List<int>> GetAccessibleTeamIdsAsync()
    {
        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        if (roleInfo.EffectiveRole == "Admin")
            return await context.Teams.Select(t => t.Id).ToListAsync();

        if (roleInfo.EffectiveRole is "ClubAdmin" or "HeadCoach" && roleInfo.ClubId.HasValue)
            return await context.Teams
                .Where(t => t.ClubId == roleInfo.ClubId.Value)
                .Select(t => t.Id)
                .ToListAsync();

        if (roleInfo.EffectiveRole == "Coach")
        {
            if (roleInfo.CoachTeamIds.Count > 0)
                return roleInfo.CoachTeamIds;
            if (roleInfo.ClubId.HasValue)
                return await context.Teams
                    .Where(t => t.ClubId == roleInfo.ClubId.Value)
                    .Select(t => t.Id)
                    .ToListAsync();
            return [];
        }

        // Player / regular user: only teams where they are listed as a team member
        if (roleInfo.ClubId.HasValue)
        {
            var memberId = await context.Members
                .Where(m => m.AppUserId == userId && m.ClubId == roleInfo.ClubId.Value)
                .Select(m => (int?)m.Id)
                .FirstOrDefaultAsync();
            if (memberId == null) return [];

            return await context.TeamMembers
                .Where(tm => tm.MemberId == memberId.Value && tm.TeamId.HasValue)
                .Select(tm => tm.TeamId!.Value)
                .Distinct()
                .ToListAsync();
        }

        return [];
    }

    /// <summary>Write access: Admin, ClubAdmin/HeadCoach of the team's club, or coach of the team.</summary>
    private async Task<bool> CanManagePlanAsync(int teamId)
    {
        if (IsAdmin()) return true;

        var teamClubId = await context.Teams
            .Where(t => t.Id == teamId)
            .Select(t => (int?)t.ClubId)
            .FirstOrDefaultAsync();
        if (teamClubId == null) return false;

        var myRoles = await clubRoleService.GetAllUserClubRolesAsync(GetCurrentUserId()!);
        var roleInClub = myRoles.FirstOrDefault(r => r.ClubId == teamClubId.Value);
        if (roleInClub == null) return false;

        if (roleInClub.EffectiveRole is "ClubAdmin" or "HeadCoach") return true;
        return roleInClub.EffectiveRole == "Coach" && roleInClub.CoachTeamIds.Contains(teamId);
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private static TagDto ToTagDto(Tag t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Color = t.Color,
        ParentTagId = t.ParentTagId,
        IsTrainingGoal = t.IsTrainingGoal
    };

    private static MicrocycleDto ToDto(Microcycle m, Dictionary<int, int>? scheduledCounts = null) => new()
    {
        Id = m.Id,
        MesocycleId = m.MesocycleId,
        Name = m.Name,
        Type = m.Type,
        StartDate = m.StartDate,
        EndDate = m.EndDate,
        Goal = m.Goal,
        GoalTagIds = m.GoalTags.Select(gt => gt.TagId).ToList(),
        GoalTags = m.GoalTags.Where(gt => gt.Tag != null).Select(gt => ToTagDto(gt.Tag!)).ToList(),
        RecommendedTrainings = m.RecommendedTrainings
            .OrderBy(rt => rt.SortOrder)
            .Select(rt => new MicrocycleTrainingDto
            {
                Id = rt.Id,
                TrainingId = rt.TrainingId,
                TrainingName = rt.Training?.Name ?? string.Empty,
                Duration = rt.Training?.Duration ?? 0,
                Note = rt.Note,
                SortOrder = rt.SortOrder,
                ScheduledCount = scheduledCounts?.GetValueOrDefault(rt.Id) ?? 0
            }).ToList()
    };

    private static MesocycleDto ToDto(Mesocycle m, Dictionary<int, int>? scheduledCounts = null) => new()
    {
        Id = m.Id,
        TeamId = m.TeamId,
        Name = m.Name,
        Phase = m.Phase,
        StartDate = m.StartDate,
        EndDate = m.EndDate,
        Goal = m.Goal,
        GoalTagIds = m.GoalTags.Select(gt => gt.TagId).ToList(),
        GoalTags = m.GoalTags.Where(gt => gt.Tag != null).Select(gt => ToTagDto(gt.Tag!)).ToList(),
        Microcycles = m.Microcycles
            .OrderBy(mc => mc.StartDate)
            .Select(mc => ToDto(mc, scheduledCounts))
            .ToList()
    };

    private IQueryable<Mesocycle> MesocyclesWithDetails() => context.Mesocycles
        .Include(m => m.GoalTags).ThenInclude(gt => gt.Tag)
        .Include(m => m.Microcycles).ThenInclude(mc => mc.GoalTags).ThenInclude(gt => gt.Tag)
        .Include(m => m.Microcycles).ThenInclude(mc => mc.RecommendedTrainings).ThenInclude(rt => rt.Training);

    /// <summary>
    /// Counts appointments using each recommended training (same team, start inside the
    /// microcycle range), keyed by MicrocycleTraining.Id.
    /// </summary>
    private async Task<Dictionary<int, int>> GetScheduledCountsAsync(int teamId, IEnumerable<Microcycle> microcycles)
    {
        var result = new Dictionary<int, int>();
        var items = microcycles
            .SelectMany(mc => mc.RecommendedTrainings.Select(rt => (rt.Id, rt.TrainingId, mc.StartDate, mc.EndDate)))
            .ToList();
        if (items.Count == 0) return result;

        var trainingIds = items.Select(i => i.TrainingId).Distinct().ToList();
        var minStart = items.Min(i => i.StartDate);
        var maxEnd = items.Max(i => i.EndDate).AddDays(1);

        var appointments = await context.Appointments
            .Where(a => a.TeamId == teamId
                        && a.TrainingId != null && trainingIds.Contains(a.TrainingId.Value)
                        && a.Start >= minStart && a.Start < maxEnd)
            .Select(a => new { TrainingId = a.TrainingId!.Value, a.Start })
            .ToListAsync();

        foreach (var item in items)
        {
            result[item.Id] = appointments.Count(a =>
                a.TrainingId == item.TrainingId
                && a.Start >= item.StartDate
                && a.Start < item.EndDate.AddDays(1));
        }

        return result;
    }

    // ── Validation helpers ───────────────────────────────────────────────────

    private static bool RangesOverlap(DateTime startA, DateTime endA, DateTime startB, DateTime endB)
        => startA <= endB && startB <= endA;

    private async Task<string?> ValidateGoalTagsAsync(List<int> tagIds)
    {
        if (tagIds.Distinct().Count() != tagIds.Count)
            return "Cíle se nesmí opakovat.";
        if (tagIds.Count > MaxGoalTags)
            return $"Cyklus může mít nejvýše {MaxGoalTags} cíle.";
        if (tagIds.Count == 0) return null;

        var validCount = await context.Tags
            .CountAsync(t => tagIds.Contains(t.Id) && t.IsTrainingGoal);
        return validCount == tagIds.Count
            ? null
            : "Cíle cyklu musí být existující tréninkové cíle.";
    }

    // ── Read endpoints ───────────────────────────────────────────────────────

    /// <summary>GET /seasonplan/team/{teamId} — full nested plan of a team</summary>
    [HttpGet("team/{teamId:int}")]
    public async Task<IActionResult> GetPlan(int teamId)
    {
        var team = await context.Teams
            .Include(t => t.Season)
            .FirstOrDefaultAsync(t => t.Id == teamId);
        if (team == null) return NotFound();

        var accessibleTeamIds = await GetAccessibleTeamIdsAsync();
        if (!accessibleTeamIds.Contains(teamId)) return Forbid();

        var mesocycles = await MesocyclesWithDetails()
            .Where(m => m.TeamId == teamId)
            .OrderBy(m => m.StartDate)
            .ToListAsync();

        var scheduledCounts = await GetScheduledCountsAsync(
            teamId, mesocycles.SelectMany(m => m.Microcycles));

        return Ok(new SeasonPlanDto
        {
            TeamId = team.Id,
            TeamName = team.Name,
            SeasonId = team.SeasonId,
            SeasonName = team.Season?.Name,
            SeasonStart = team.Season?.StartDate,
            SeasonEnd = team.Season?.EndDate,
            Mesocycles = mesocycles.Select(m => ToDto(m, scheduledCounts)).ToList()
        });
    }

    /// <summary>GET /seasonplan/calendar?teamId=&amp;from=&amp;to= — flat cycles for calendar tinting</summary>
    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendarCycles(
        [FromQuery] int teamId, [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var accessibleTeamIds = await GetAccessibleTeamIdsAsync();
        if (!accessibleTeamIds.Contains(teamId)) return Forbid();

        var fromDate = from.Date;
        var toDate = to.Date;

        var cycles = await context.Microcycles
            .Where(mc => mc.Mesocycle!.TeamId == teamId
                         && mc.StartDate <= toDate && mc.EndDate >= fromDate)
            .OrderBy(mc => mc.StartDate)
            .Select(mc => new CycleCalendarDto
            {
                MicrocycleId = mc.Id,
                MesocycleId = mc.MesocycleId,
                MesocycleName = mc.Mesocycle!.Name,
                Phase = mc.Mesocycle.Phase,
                MicrocycleName = mc.Name,
                Type = mc.Type,
                StartDate = mc.StartDate,
                EndDate = mc.EndDate
            })
            .ToListAsync();

        return Ok(cycles);
    }

    // ── Mesocycle CRUD ───────────────────────────────────────────────────────

    /// <summary>POST /seasonplan/mesocycles</summary>
    [HttpPost("mesocycles")]
    public async Task<IActionResult> CreateMesocycle([FromBody] MesocycleDto dto)
    {
        if (!await CanManagePlanAsync(dto.TeamId)) return Forbid();

        var error = await ValidateMesocycleAsync(dto, excludeId: null);
        if (error != null) return BadRequest(new { message = error });

        var mesocycle = new Mesocycle
        {
            TeamId = dto.TeamId,
            Name = dto.Name.Trim(),
            Phase = dto.Phase,
            StartDate = dto.StartDate.Date,
            EndDate = dto.EndDate.Date,
            Goal = dto.Goal,
            GoalTags = dto.GoalTagIds.Distinct().Select(id => new MesocycleTag { TagId = id }).ToList()
        };

        context.Mesocycles.Add(mesocycle);
        await context.SaveChangesAsync();

        return Ok(await LoadMesocycleDtoAsync(mesocycle.Id));
    }

    /// <summary>
    /// PUT /seasonplan/mesocycles/{id}?shiftFollowing=&amp;shiftChildren= — with shiftFollowing,
    /// every later mesocycle of the team (incl. its microcycles) is shifted by the change of the
    /// end date, so gaps between cycles are preserved. With shiftChildren (used by timeline
    /// drag-move), the mesocycle's own microcycles move by the change of the start date.
    /// </summary>
    [HttpPut("mesocycles/{id:int}")]
    public async Task<IActionResult> UpdateMesocycle(
        int id, [FromBody] MesocycleDto dto,
        [FromQuery] bool shiftFollowing = false,
        [FromQuery] bool shiftChildren = false)
    {
        var mesocycle = await context.Mesocycles
            .Include(m => m.GoalTags)
            .Include(m => m.Microcycles)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (mesocycle == null) return NotFound();

        if (!await CanManagePlanAsync(mesocycle.TeamId)) return Forbid();

        var oldStart = mesocycle.StartDate;
        var oldEnd = mesocycle.EndDate;

        dto.TeamId = mesocycle.TeamId; // team of a plan cannot be changed
        // Following siblings are about to move by the same delta, so skip them in the overlap check
        var error = await ValidateMesocycleAsync(dto, excludeId: id,
            ignoreSiblingsAfter: shiftFollowing ? oldEnd : null);
        if (error != null) return BadRequest(new { message = error });

        var newStart = dto.StartDate.Date;
        var newEnd = dto.EndDate.Date;

        if (shiftChildren)
        {
            var childDelta = newStart - oldStart;
            if (childDelta != TimeSpan.Zero)
            {
                foreach (var mc in mesocycle.Microcycles)
                {
                    mc.StartDate += childDelta;
                    mc.EndDate += childDelta;
                }
            }
        }

        // Shrinking must not orphan existing microcycles
        var outOfRange = mesocycle.Microcycles
            .Any(mc => mc.StartDate < newStart || mc.EndDate > newEnd);
        if (outOfRange)
            return BadRequest(new { message = "Mikrocykly by se nevešly do nového rozsahu mezocyklu. Nejprve je upravte." });

        mesocycle.Name = dto.Name.Trim();
        mesocycle.Phase = dto.Phase;
        mesocycle.StartDate = newStart;
        mesocycle.EndDate = newEnd;
        mesocycle.Goal = dto.Goal;
        SyncTags(mesocycle.GoalTags, dto.GoalTagIds,
            tagId => new MesocycleTag { MesocycleId = id, TagId = tagId });

        var delta = newEnd - oldEnd;
        if (shiftFollowing && delta != TimeSpan.Zero)
        {
            var following = await context.Mesocycles
                .Include(m => m.Microcycles)
                .Where(m => m.TeamId == mesocycle.TeamId && m.Id != id && m.StartDate > oldEnd)
                .ToListAsync();

            foreach (var later in following)
            {
                later.StartDate += delta;
                later.EndDate += delta;
                foreach (var mc in later.Microcycles)
                {
                    mc.StartDate += delta;
                    mc.EndDate += delta;
                }
            }
        }

        await context.SaveChangesAsync();

        return Ok(await LoadMesocycleDtoAsync(id));
    }

    /// <summary>
    /// POST /seasonplan/mesocycles/{id}/generate-weeks — splits the mesocycle into
    /// Monday-aligned week microcycles. Existing microcycles → 409 unless overwrite=true.
    /// </summary>
    [HttpPost("mesocycles/{id:int}/generate-weeks")]
    public async Task<IActionResult> GenerateWeeks(int id, [FromBody] GenerateWeeksRequestDto dto)
    {
        var mesocycle = await context.Mesocycles
            .Include(m => m.Microcycles)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (mesocycle == null) return NotFound();

        if (!await CanManagePlanAsync(mesocycle.TeamId)) return Forbid();

        if (mesocycle.Microcycles.Count > 0 && !dto.Overwrite)
            return Conflict(new { message = "Mezocyklus už mikrocykly obsahuje. Potvrďte přepsání." });

        var prefix = string.IsNullOrWhiteSpace(dto.NamePrefix) ? "Week" : dto.NamePrefix.Trim();
        var weeks = PlanningGenerator.GenerateWeekMicrocycles(
            mesocycle.StartDate, mesocycle.EndDate, dto.Type, prefix);

        context.Microcycles.RemoveRange(mesocycle.Microcycles);
        foreach (var week in weeks) week.MesocycleId = id;
        mesocycle.Microcycles = weeks;

        await context.SaveChangesAsync();

        return Ok(await LoadMesocycleDtoAsync(id));
    }

    /// <summary>DELETE /seasonplan/mesocycles/{id}</summary>
    [HttpDelete("mesocycles/{id:int}")]
    public async Task<IActionResult> DeleteMesocycle(int id)
    {
        var mesocycle = await context.Mesocycles.FirstOrDefaultAsync(m => m.Id == id);
        if (mesocycle == null) return NotFound();

        if (!await CanManagePlanAsync(mesocycle.TeamId)) return Forbid();

        context.Mesocycles.Remove(mesocycle);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string?> ValidateMesocycleAsync(
        MesocycleDto dto, int? excludeId, DateTime? ignoreSiblingsAfter = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return "Název mezocyklu je povinný.";

        var start = dto.StartDate.Date;
        var end = dto.EndDate.Date;
        if (start > end)
            return "Začátek mezocyklu musí být před jeho koncem.";

        var teamExists = await context.Teams.AnyAsync(t => t.Id == dto.TeamId);
        if (!teamExists)
            return "Tým neexistuje.";

        var overlaps = await context.Mesocycles.AnyAsync(m =>
            m.TeamId == dto.TeamId
            && (excludeId == null || m.Id != excludeId.Value)
            && (ignoreSiblingsAfter == null || m.StartDate <= ignoreSiblingsAfter.Value)
            && m.StartDate <= end && start <= m.EndDate);
        if (overlaps)
            return "Mezocyklus se překrývá s jiným mezocyklem týmu.";

        return await ValidateGoalTagsAsync(dto.GoalTagIds);
    }

    private async Task<MesocycleDto> LoadMesocycleDtoAsync(int id)
    {
        var mesocycle = await MesocyclesWithDetails().FirstAsync(m => m.Id == id);
        var scheduledCounts = await GetScheduledCountsAsync(mesocycle.TeamId, mesocycle.Microcycles);
        return ToDto(mesocycle, scheduledCounts);
    }

    // ── Microcycle CRUD ──────────────────────────────────────────────────────

    /// <summary>POST /seasonplan/microcycles</summary>
    [HttpPost("microcycles")]
    public async Task<IActionResult> CreateMicrocycle([FromBody] MicrocycleDto dto)
    {
        var mesocycle = await context.Mesocycles
            .FirstOrDefaultAsync(m => m.Id == dto.MesocycleId);
        if (mesocycle == null) return NotFound(new { message = "Mezocyklus neexistuje." });

        if (!await CanManagePlanAsync(mesocycle.TeamId)) return Forbid();

        var error = await ValidateMicrocycleAsync(dto, mesocycle, excludeId: null);
        if (error != null) return BadRequest(new { message = error });

        var microcycle = new Microcycle
        {
            MesocycleId = dto.MesocycleId,
            Name = dto.Name.Trim(),
            Type = dto.Type,
            StartDate = dto.StartDate.Date,
            EndDate = dto.EndDate.Date,
            Goal = dto.Goal,
            GoalTags = dto.GoalTagIds.Distinct().Select(id => new MicrocycleTag { TagId = id }).ToList()
        };

        context.Microcycles.Add(microcycle);
        await context.SaveChangesAsync();

        return Ok(await LoadMicrocycleDtoAsync(microcycle.Id, mesocycle.TeamId));
    }

    /// <summary>
    /// PUT /seasonplan/microcycles/{id}?shiftFollowing= — with shiftFollowing, later siblings
    /// within the same mesocycle are shifted by the change of the end date; the shift is
    /// rejected when a sibling would leave the mesocycle range.
    /// </summary>
    [HttpPut("microcycles/{id:int}")]
    public async Task<IActionResult> UpdateMicrocycle(
        int id, [FromBody] MicrocycleDto dto, [FromQuery] bool shiftFollowing = false)
    {
        var microcycle = await context.Microcycles
            .Include(mc => mc.GoalTags)
            .Include(mc => mc.Mesocycle)
            .FirstOrDefaultAsync(mc => mc.Id == id);
        if (microcycle == null) return NotFound();

        var mesocycle = microcycle.Mesocycle!;
        if (!await CanManagePlanAsync(mesocycle.TeamId)) return Forbid();

        var oldEnd = microcycle.EndDate;

        dto.MesocycleId = microcycle.MesocycleId; // parent cannot be changed
        var error = await ValidateMicrocycleAsync(dto, mesocycle, excludeId: id,
            ignoreSiblingsAfter: shiftFollowing ? oldEnd : null);
        if (error != null) return BadRequest(new { message = error });

        var delta = dto.EndDate.Date - oldEnd;
        List<Microcycle> following = [];
        if (shiftFollowing && delta != TimeSpan.Zero)
        {
            following = await context.Microcycles
                .Where(mc => mc.MesocycleId == mesocycle.Id && mc.Id != id && mc.StartDate > oldEnd)
                .ToListAsync();

            if (following.Any(mc => mc.EndDate + delta > mesocycle.EndDate
                                    || mc.StartDate + delta < mesocycle.StartDate))
                return BadRequest(new { message = "Posunuté mikrocykly by opustily rozsah mezocyklu." });
        }

        microcycle.Name = dto.Name.Trim();
        microcycle.Type = dto.Type;
        microcycle.StartDate = dto.StartDate.Date;
        microcycle.EndDate = dto.EndDate.Date;
        microcycle.Goal = dto.Goal;
        SyncTags(microcycle.GoalTags, dto.GoalTagIds,
            tagId => new MicrocycleTag { MicrocycleId = id, TagId = tagId });

        foreach (var later in following)
        {
            later.StartDate += delta;
            later.EndDate += delta;
        }

        await context.SaveChangesAsync();

        return Ok(await LoadMicrocycleDtoAsync(id, mesocycle.TeamId));
    }

    /// <summary>DELETE /seasonplan/microcycles/{id}</summary>
    [HttpDelete("microcycles/{id:int}")]
    public async Task<IActionResult> DeleteMicrocycle(int id)
    {
        var microcycle = await context.Microcycles
            .Include(mc => mc.Mesocycle)
            .FirstOrDefaultAsync(mc => mc.Id == id);
        if (microcycle == null) return NotFound();

        if (!await CanManagePlanAsync(microcycle.Mesocycle!.TeamId)) return Forbid();

        context.Microcycles.Remove(microcycle);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string?> ValidateMicrocycleAsync(
        MicrocycleDto dto, Mesocycle mesocycle, int? excludeId, DateTime? ignoreSiblingsAfter = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return "Název mikrocyklu je povinný.";

        var start = dto.StartDate.Date;
        var end = dto.EndDate.Date;
        if (start > end)
            return "Začátek mikrocyklu musí být před jeho koncem.";

        if (start < mesocycle.StartDate || end > mesocycle.EndDate)
            return "Mikrocyklus musí ležet uvnitř mezocyklu.";

        var overlaps = await context.Microcycles.AnyAsync(mc =>
            mc.MesocycleId == mesocycle.Id
            && (excludeId == null || mc.Id != excludeId.Value)
            && (ignoreSiblingsAfter == null || mc.StartDate <= ignoreSiblingsAfter.Value)
            && mc.StartDate <= end && start <= mc.EndDate);
        if (overlaps)
            return "Mikrocyklus se překrývá s jiným mikrocyklem mezocyklu.";

        return await ValidateGoalTagsAsync(dto.GoalTagIds);
    }

    private async Task<MicrocycleDto> LoadMicrocycleDtoAsync(int id, int teamId)
    {
        var microcycle = await context.Microcycles
            .Include(mc => mc.GoalTags).ThenInclude(gt => gt.Tag)
            .Include(mc => mc.RecommendedTrainings).ThenInclude(rt => rt.Training)
            .FirstAsync(mc => mc.Id == id);
        var scheduledCounts = await GetScheduledCountsAsync(teamId, [microcycle]);
        return ToDto(microcycle, scheduledCounts);
    }

    // ── Recommended trainings ────────────────────────────────────────────────

    /// <summary>PUT /seasonplan/microcycles/{id}/trainings — replace-set of recommended trainings</summary>
    [HttpPut("microcycles/{id:int}/trainings")]
    public async Task<IActionResult> SetMicrocycleTrainings(int id, [FromBody] MicrocycleTrainingsUpdateDto dto)
    {
        var microcycle = await context.Microcycles
            .Include(mc => mc.Mesocycle)
            .Include(mc => mc.RecommendedTrainings)
            .FirstOrDefaultAsync(mc => mc.Id == id);
        if (microcycle == null) return NotFound();

        var teamId = microcycle.Mesocycle!.TeamId;
        if (!await CanManagePlanAsync(teamId)) return Forbid();

        var trainingIds = dto.Items.Select(i => i.TrainingId).ToList();
        if (trainingIds.Distinct().Count() != trainingIds.Count)
            return BadRequest(new { message = "Trénink lze doporučit jen jednou." });

        var existingCount = await context.Trainings.CountAsync(t => trainingIds.Contains(t.Id));
        if (existingCount != trainingIds.Count)
            return BadRequest(new { message = "Některý z tréninků neexistuje." });

        context.MicrocycleTrainings.RemoveRange(microcycle.RecommendedTrainings);
        microcycle.RecommendedTrainings = dto.Items.Select(i => new MicrocycleTraining
        {
            MicrocycleId = id,
            TrainingId = i.TrainingId,
            Note = i.Note,
            SortOrder = i.SortOrder
        }).ToList();

        await context.SaveChangesAsync();

        return Ok(await LoadMicrocycleDtoAsync(id, teamId));
    }

    // ── Evaluation ───────────────────────────────────────────────────────────

    private const int TestingWindowDays = 7;

    /// <summary>
    /// GET /seasonplan/mesocycles/{id}/evaluation — goal coverage (held Training-type events),
    /// attendance + ratings aggregates, and test progression between the mesocycle boundaries
    /// (testing events ±7 days around start/end). One summary per mesocycle, incl. per-microcycle blocks.
    /// </summary>
    [HttpGet("mesocycles/{id:int}/evaluation")]
    public async Task<IActionResult> GetEvaluation(int id)
    {
        var mesocycle = await context.Mesocycles
            .Include(m => m.GoalTags).ThenInclude(gt => gt.Tag)
            .Include(m => m.Microcycles).ThenInclude(mc => mc.GoalTags).ThenInclude(gt => gt.Tag)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (mesocycle == null) return NotFound();

        var accessibleTeamIds = await GetAccessibleTeamIdsAsync();
        if (!accessibleTeamIds.Contains(mesocycle.TeamId)) return Forbid();

        var rangeFrom = mesocycle.StartDate;
        var rangeToExclusive = mesocycle.EndDate.AddDays(1);

        // One load of the team's appointments in range; trainings deep for tag-coverage math
        var appointments = await context.Appointments
            .Include(a => a.Attendances)
            .Include(a => a.Ratings)
            .Include(a => a.Training!)
                .ThenInclude(tr => tr.TrainingParts)!
                .ThenInclude(tp => tp.TrainingGroups)!
                .ThenInclude(tg => tg.Activity)!
                .ThenInclude(act => act!.ActivityTags)
            .Where(a => a.TeamId == mesocycle.TeamId
                        && a.Start >= rangeFrom && a.Start < rangeToExclusive)
            .ToListAsync();

        var mesoGoalTags = mesocycle.GoalTags.Where(gt => gt.Tag != null).ToList();

        var result = new MesocycleEvaluationDto
        {
            Total = BuildEvaluationBlock(
                mesocycle.Id, mesocycle.Name, mesocycle.StartDate, mesocycle.EndDate,
                mesoGoalTags.Select(gt => gt.Tag!).ToList(), appointments),
            Microcycles = mesocycle.Microcycles
                .OrderBy(mc => mc.StartDate)
                .Select(mc =>
                {
                    // Effective goals: the microcycle's own tags, falling back to the mesocycle's
                    var tags = mc.GoalTags.Where(gt => gt.Tag != null).Select(gt => gt.Tag!).ToList();
                    if (tags.Count == 0) tags = mesoGoalTags.Select(gt => gt.Tag!).ToList();
                    return BuildEvaluationBlock(mc.Id, mc.Name, mc.StartDate, mc.EndDate, tags, appointments);
                })
                .ToList()
        };

        await AddTestProgressionAsync(result, mesocycle);

        return Ok(result);
    }

    private static CycleEvaluationBlockDto BuildEvaluationBlock(
        int cycleId, string name, DateTime start, DateTime endInclusive,
        List<Tag> goalTags, List<Appointment> teamAppointments)
    {
        var endExclusive = endInclusive.AddDays(1);
        var inRange = teamAppointments
            .Where(a => a.Start >= start && a.Start < endExclusive)
            .ToList();

        var now = DateTime.Now;
        var heldTrainingEvents = inRange
            .Where(a => a.AppointmentType == AppointmentType.Training && a.End <= now)
            .ToList();
        var withTraining = heldTrainingEvents.Where(a => a.Training != null).ToList();

        var tagIds = goalTags.Select(t => t.Id).ToList();
        var totalMinutes = withTraining.Sum(a => a.Training!.GetActivitiesDuration());
        var matchedMinutes = withTraining.Sum(a => a.Training!.GetActivitiesDurationForTags(tagIds));

        var attendances = inRange.SelectMany(a => a.Attendances).ToList();
        var present = attendances.Count(at => at.Status == 1);
        var absent = attendances.Count(at => at.Status == 2);
        var excused = attendances.Count(at => at.Status == 3);
        var attendanceDenominator = present + absent + excused;

        var ratings = inRange.SelectMany(a => a.Ratings).ToList();
        var coachRatings = ratings.Where(r => r.RaterType == RaterType.Coach).ToList();
        var playerRatings = ratings.Where(r => r.RaterType == RaterType.Player).ToList();

        return new CycleEvaluationBlockDto
        {
            CycleId = cycleId,
            Name = name,
            From = start,
            To = endInclusive,
            TrainingAppointmentsCount = heldTrainingEvents.Count,
            WithLinkedTrainingCount = withTraining.Count,
            TotalTrainingMinutes = totalMinutes,
            GoalMatchedMinutes = matchedMinutes,
            GoalCoveragePercent = totalMinutes > 0
                ? Math.Round(100.0 * matchedMinutes / totalMinutes, 1)
                : 0,
            PerTag = goalTags.Select(tag => new TagCoverageDto
            {
                TagId = tag.Id,
                TagName = tag.Name,
                Color = tag.Color,
                MatchedMinutes = withTraining.Sum(a => a.Training!.GetActivitiesDurationForTags([tag.Id])),
                TrainingsCount = withTraining.Count(a => a.Training!.GetActivitiesDurationForTags([tag.Id]) > 0)
            }).ToList(),
            PresentCount = present,
            AbsentCount = absent,
            ExcusedCount = excused,
            UnknownCount = attendances.Count(at => at.Status == 0),
            AttendanceRatePercent = attendanceDenominator > 0
                ? Math.Round(100.0 * present / attendanceDenominator, 1)
                : 0,
            AverageGrade = ratings.Count > 0 ? Math.Round(ratings.Average(r => r.Grade), 2) : null,
            RatingsCount = ratings.Count,
            CoachAverageGrade = coachRatings.Count > 0
                ? Math.Round(coachRatings.Average(r => r.Grade), 2)
                : null,
            PlayerAverageGrade = playerRatings.Count > 0
                ? Math.Round(playerRatings.Average(r => r.Grade), 2)
                : null,
        };
    }

    /// <summary>Test progression between testing events near the mesocycle start and end (±7 days).</summary>
    private async Task AddTestProgressionAsync(MesocycleEvaluationDto result, Mesocycle mesocycle)
    {
        var startFrom = mesocycle.StartDate.AddDays(-TestingWindowDays);
        var startTo = mesocycle.StartDate.AddDays(TestingWindowDays + 1);
        var endFrom = mesocycle.EndDate.AddDays(-TestingWindowDays);
        var endTo = mesocycle.EndDate.AddDays(TestingWindowDays + 1);

        var testingAppointments = await context.Appointments
            .Include(a => a.AppointmentTestDefinitions).ThenInclude(atd => atd.TestDefinition)
            .Where(a => a.TeamId == mesocycle.TeamId
                        && a.AppointmentType == AppointmentType.Testing
                        && ((a.Start >= startFrom && a.Start < startTo)
                            || (a.Start >= endFrom && a.Start < endTo)))
            .OrderBy(a => a.Start)
            .ToListAsync();

        result.TestingAppointments = testingAppointments
            .Select(a => new AppointmentRefDto { Id = a.Id, Name = a.Name, Start = a.Start })
            .ToList();

        var testDefinitions = testingAppointments
            .SelectMany(a => a.AppointmentTestDefinitions)
            .Where(atd => atd.TestDefinition != null)
            .Select(atd => atd.TestDefinition!)
            .DistinctBy(td => td.Id)
            .ToList();
        if (testDefinitions.Count == 0) return;

        var testDefinitionIds = testDefinitions.Select(td => td.Id).ToList();
        var memberIds = await context.TeamMembers
            .Where(tm => tm.TeamId == mesocycle.TeamId)
            .Select(tm => tm.MemberId)
            .Distinct()
            .ToListAsync();
        if (memberIds.Count == 0) return;

        var results = await context.TestResults
            .Where(r => testDefinitionIds.Contains(r.TestDefinitionId)
                        && memberIds.Contains(r.MemberId)
                        && r.NumericValue != null
                        && ((r.TestDate >= startFrom && r.TestDate < startTo)
                            || (r.TestDate >= endFrom && r.TestDate < endTo)))
            .ToListAsync();

        foreach (var definition in testDefinitions)
        {
            var ofTest = results.Where(r => r.TestDefinitionId == definition.Id).ToList();
            // Average per member per window; a test counts only when measured in both windows
            var startByMember = ofTest
                .Where(r => r.TestDate >= startFrom && r.TestDate < startTo)
                .GroupBy(r => r.MemberId)
                .ToDictionary(g => g.Key, g => g.Average(r => r.NumericValue!.Value));
            var endByMember = ofTest
                .Where(r => r.TestDate >= endFrom && r.TestDate < endTo)
                .GroupBy(r => r.MemberId)
                .ToDictionary(g => g.Key, g => g.Average(r => r.NumericValue!.Value));

            var measuredBoth = startByMember.Keys.Intersect(endByMember.Keys).ToList();
            if (measuredBoth.Count == 0) continue;

            var startAvg = Math.Round(measuredBoth.Average(m => startByMember[m]), 2);
            var endAvg = Math.Round(measuredBoth.Average(m => endByMember[m]), 2);

            result.TestProgression.Add(new TestProgressionDto
            {
                TestDefinitionId = definition.Id,
                Name = definition.Name,
                Unit = definition.Unit,
                HigherIsBetter = definition.HigherIsBetter,
                StartAvg = startAvg,
                EndAvg = endAvg,
                Delta = Math.Round(endAvg - startAvg, 2),
                ImprovedCount = measuredBoth.Count(m => definition.HigherIsBetter
                    ? endByMember[m] > startByMember[m]
                    : endByMember[m] < startByMember[m]),
                WorsenedCount = measuredBoth.Count(m => definition.HigherIsBetter
                    ? endByMember[m] < startByMember[m]
                    : endByMember[m] > startByMember[m]),
                MembersMeasuredBoth = measuredBoth.Count
            });
        }
    }

    // ── Shared helpers ───────────────────────────────────────────────────────

    /// <summary>Syncs cycle goal-tag links to the requested tag id set (add missing, remove extra).</summary>
    private void SyncTags<TLink>(List<TLink> current, List<int> requestedTagIds, Func<int, TLink> create)
        where TLink : class
    {
        var requested = requestedTagIds.Distinct().ToHashSet();
        var currentByTagId = current.ToDictionary(GetTagId);

        foreach (var (tagId, link) in currentByTagId)
        {
            if (!requested.Contains(tagId))
            {
                current.Remove(link);
                context.Remove(link);
            }
        }

        foreach (var tagId in requested)
        {
            if (!currentByTagId.ContainsKey(tagId))
                current.Add(create(tagId));
        }

        static int GetTagId(TLink link) => link switch
        {
            MesocycleTag mt => mt.TagId,
            MicrocycleTag mt => mt.TagId,
            _ => throw new InvalidOperationException("Unsupported tag link type.")
        };
    }
}
