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
    private const int MaxGoalSkills = 3;

    /// <summary>i-th element of a (max-3) goal-skill id list, or null when it isn't set.</summary>
    private static int? GoalSkillAt(List<int> ids, int i) => i < ids.Count ? ids[i] : null;

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

    private static SkillDto ToSkillDto(Skill s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        SkillCategoryId = s.SkillCategoryId,
        SkillCategoryName = s.SkillCategory?.Name
    };

    private static List<int> GoalSkillIds(int? id1, int? id2, int? id3) =>
        new[] { id1, id2, id3 }.Where(x => x.HasValue).Select(x => x!.Value).ToList();

    private static List<SkillDto> GoalSkillDtos(params Skill?[] skills) =>
        skills.Where(s => s != null).Select(s => ToSkillDto(s!)).ToList();

    private static MicrocycleDto ToDto(Microcycle m) => new()
    {
        Id = m.Id,
        MesocycleId = m.MesocycleId,
        Name = m.Name,
        Type = m.Type,
        StartDate = m.StartDate,
        EndDate = m.EndDate,
        Goal = m.Goal,
        GoalSkillIds = GoalSkillIds(m.GoalSkill1Id, m.GoalSkill2Id, m.GoalSkill3Id),
        GoalSkills = GoalSkillDtos(m.GoalSkill1, m.GoalSkill2, m.GoalSkill3),
    };

    private static MesocycleDto ToDto(Mesocycle m) => new()
    {
        Id = m.Id,
        TeamId = m.TeamId,
        Name = m.Name,
        Phase = m.Phase,
        StartDate = m.StartDate,
        EndDate = m.EndDate,
        Goal = m.Goal,
        GoalSkillIds = GoalSkillIds(m.GoalSkill1Id, m.GoalSkill2Id, m.GoalSkill3Id),
        GoalSkills = GoalSkillDtos(m.GoalSkill1, m.GoalSkill2, m.GoalSkill3),
        Microcycles = m.Microcycles
            .OrderBy(mc => mc.StartDate)
            .Select(ToDto)
            .ToList()
    };

    private IQueryable<Mesocycle> MesocyclesWithDetails() => context.Mesocycles
        .Include(m => m.GoalSkill1).Include(m => m.GoalSkill2).Include(m => m.GoalSkill3)
        .Include(m => m.Microcycles).ThenInclude(mc => mc.GoalSkill1)
        .Include(m => m.Microcycles).ThenInclude(mc => mc.GoalSkill2)
        .Include(m => m.Microcycles).ThenInclude(mc => mc.GoalSkill3);

    // ── Validation helpers ───────────────────────────────────────────────────

    private static bool RangesOverlap(DateTime startA, DateTime endA, DateTime startB, DateTime endB)
        => startA <= endB && startB <= endA;

    private async Task<string?> ValidateGoalSkillsAsync(List<int> skillIds)
    {
        if (skillIds.Distinct().Count() != skillIds.Count)
            return "Cíle se nesmí opakovat.";
        if (skillIds.Count > MaxGoalSkills)
            return $"Cyklus může mít nejvýše {MaxGoalSkills} cíle.";
        if (skillIds.Count == 0) return null;

        var validCount = await context.Skills.CountAsync(s => skillIds.Contains(s.Id));
        return validCount == skillIds.Count
            ? null
            : "Cíle cyklu musí být existující dovednosti.";
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

        return Ok(new SeasonPlanDto
        {
            TeamId = team.Id,
            TeamName = team.Name,
            SeasonId = team.SeasonId,
            SeasonName = team.Season?.Name,
            SeasonStart = team.Season?.StartDate,
            SeasonEnd = team.Season?.EndDate,
            Mesocycles = mesocycles.Select(ToDto).ToList()
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

        var microcycles = await context.Microcycles
            .Where(mc => mc.Mesocycle!.TeamId == teamId
                         && mc.StartDate <= toDate && mc.EndDate >= fromDate)
            .Include(mc => mc.GoalSkill1).Include(mc => mc.GoalSkill2).Include(mc => mc.GoalSkill3)
            .Include(mc => mc.Mesocycle!).ThenInclude(m => m.GoalSkill1)
            .Include(mc => mc.Mesocycle!).ThenInclude(m => m.GoalSkill2)
            .Include(mc => mc.Mesocycle!).ThenInclude(m => m.GoalSkill3)
            .OrderBy(mc => mc.StartDate)
            .ToListAsync();

        var cycles = microcycles.Select(mc => new CycleCalendarDto
        {
            MicrocycleId = mc.Id,
            MesocycleId = mc.MesocycleId,
            MesocycleName = mc.Mesocycle!.Name,
            Phase = mc.Mesocycle.Phase,
            MicrocycleName = mc.Name,
            Type = mc.Type,
            StartDate = mc.StartDate,
            EndDate = mc.EndDate,
            MesocycleGoalSkills = GoalSkillDtos(mc.Mesocycle.GoalSkill1, mc.Mesocycle.GoalSkill2, mc.Mesocycle.GoalSkill3),
            MicrocycleGoalSkills = GoalSkillDtos(mc.GoalSkill1, mc.GoalSkill2, mc.GoalSkill3)
        }).ToList();

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

        var skillIds = dto.GoalSkillIds.Distinct().Take(MaxGoalSkills).ToList();
        var mesocycle = new Mesocycle
        {
            TeamId = dto.TeamId,
            Name = dto.Name.Trim(),
            Phase = dto.Phase,
            StartDate = dto.StartDate.Date,
            EndDate = dto.EndDate.Date,
            Goal = dto.Goal,
            GoalSkill1Id = GoalSkillAt(skillIds, 0),
            GoalSkill2Id = GoalSkillAt(skillIds, 1),
            GoalSkill3Id = GoalSkillAt(skillIds, 2)
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

        var skillIds = dto.GoalSkillIds.Distinct().Take(MaxGoalSkills).ToList();
        mesocycle.Name = dto.Name.Trim();
        mesocycle.Phase = dto.Phase;
        mesocycle.StartDate = newStart;
        mesocycle.EndDate = newEnd;
        mesocycle.Goal = dto.Goal;
        mesocycle.GoalSkill1Id = GoalSkillAt(skillIds, 0);
        mesocycle.GoalSkill2Id = GoalSkillAt(skillIds, 1);
        mesocycle.GoalSkill3Id = GoalSkillAt(skillIds, 2);

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

        return await ValidateGoalSkillsAsync(dto.GoalSkillIds);
    }

    private async Task<MesocycleDto> LoadMesocycleDtoAsync(int id)
    {
        var mesocycle = await MesocyclesWithDetails().FirstAsync(m => m.Id == id);
        return ToDto(mesocycle);
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

        var skillIds = dto.GoalSkillIds.Distinct().Take(MaxGoalSkills).ToList();
        var microcycle = new Microcycle
        {
            MesocycleId = dto.MesocycleId,
            Name = dto.Name.Trim(),
            Type = dto.Type,
            StartDate = dto.StartDate.Date,
            EndDate = dto.EndDate.Date,
            Goal = dto.Goal,
            GoalSkill1Id = GoalSkillAt(skillIds, 0),
            GoalSkill2Id = GoalSkillAt(skillIds, 1),
            GoalSkill3Id = GoalSkillAt(skillIds, 2)
        };

        context.Microcycles.Add(microcycle);
        await context.SaveChangesAsync();

        return Ok(await LoadMicrocycleDtoAsync(microcycle.Id));
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

        var skillIds = dto.GoalSkillIds.Distinct().Take(MaxGoalSkills).ToList();
        microcycle.Name = dto.Name.Trim();
        microcycle.Type = dto.Type;
        microcycle.StartDate = dto.StartDate.Date;
        microcycle.EndDate = dto.EndDate.Date;
        microcycle.Goal = dto.Goal;
        microcycle.GoalSkill1Id = GoalSkillAt(skillIds, 0);
        microcycle.GoalSkill2Id = GoalSkillAt(skillIds, 1);
        microcycle.GoalSkill3Id = GoalSkillAt(skillIds, 2);

        foreach (var later in following)
        {
            later.StartDate += delta;
            later.EndDate += delta;
        }

        await context.SaveChangesAsync();

        return Ok(await LoadMicrocycleDtoAsync(id));
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

        return await ValidateGoalSkillsAsync(dto.GoalSkillIds);
    }

    private async Task<MicrocycleDto> LoadMicrocycleDtoAsync(int id)
    {
        var microcycle = await context.Microcycles
            .Include(mc => mc.GoalSkill1).Include(mc => mc.GoalSkill2).Include(mc => mc.GoalSkill3)
            .FirstAsync(mc => mc.Id == id);
        return ToDto(microcycle);
    }

    // ── Team events inside the plan ──────────────────────────────────────────

    public class SetAppointmentTrainingDto
    {
        /// <summary>Training to attach, or null to detach.</summary>
        public int? TrainingId { get; set; }
    }

    /// <summary>
    /// PUT /seasonplan/appointments/{id}/training — attach or detach a training on a team event
    /// straight from the plan view (per-week event → training). Only the linked training changes.
    /// </summary>
    [HttpPut("appointments/{id:int}/training")]
    public async Task<IActionResult> SetAppointmentTraining(int id, [FromBody] SetAppointmentTrainingDto dto)
    {
        var appointment = await context.Appointments.FirstOrDefaultAsync(a => a.Id == id);
        if (appointment == null) return NotFound();
        if (appointment.TeamId == null || !await CanManagePlanAsync(appointment.TeamId.Value))
            return Forbid();

        if (dto.TrainingId.HasValue &&
            !await context.Trainings.AnyAsync(tr => tr.Id == dto.TrainingId.Value))
            return BadRequest(new { message = "Trénink neexistuje." });

        appointment.TrainingId = dto.TrainingId;
        await context.SaveChangesAsync();
        return NoContent();
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
            .Include(m => m.GoalSkill1).Include(m => m.GoalSkill2).Include(m => m.GoalSkill3)
            .Include(m => m.Microcycles).ThenInclude(mc => mc.GoalSkill1)
            .Include(m => m.Microcycles).ThenInclude(mc => mc.GoalSkill2)
            .Include(m => m.Microcycles).ThenInclude(mc => mc.GoalSkill3)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (mesocycle == null) return NotFound();

        var accessibleTeamIds = await GetAccessibleTeamIdsAsync();
        if (!accessibleTeamIds.Contains(mesocycle.TeamId)) return Forbid();

        var rangeFrom = mesocycle.StartDate;
        var rangeToExclusive = mesocycle.EndDate.AddDays(1);

        // One load of the team's appointments in range; trainings deep for skill-coverage math
        var appointments = await context.Appointments
            .Include(a => a.Attendances)
            .Include(a => a.Ratings)
            .Include(a => a.Training!)
                .ThenInclude(tr => tr.TrainingParts)!
                .ThenInclude(tp => tp.TrainingGroups)!
                .ThenInclude(tg => tg.Activity)!
                .ThenInclude(act => act!.ActivitySkills)
            .Where(a => a.TeamId == mesocycle.TeamId
                        && a.Start >= rangeFrom && a.Start < rangeToExclusive)
            .ToListAsync();

        var mesoGoalSkills = GoalSkillList(mesocycle.GoalSkill1, mesocycle.GoalSkill2, mesocycle.GoalSkill3);

        var result = new MesocycleEvaluationDto
        {
            Total = BuildEvaluationBlock(
                mesocycle.Id, mesocycle.Name, mesocycle.StartDate, mesocycle.EndDate,
                mesoGoalSkills, appointments),
            Microcycles = mesocycle.Microcycles
                .OrderBy(mc => mc.StartDate)
                .Select(mc =>
                {
                    // Effective goals: the microcycle's own skills, falling back to the mesocycle's
                    var skills = GoalSkillList(mc.GoalSkill1, mc.GoalSkill2, mc.GoalSkill3);
                    if (skills.Count == 0) skills = mesoGoalSkills;
                    return BuildEvaluationBlock(mc.Id, mc.Name, mc.StartDate, mc.EndDate, skills, appointments);
                })
                .ToList()
        };

        await AddTestProgressionAsync(result, mesocycle);

        return Ok(result);
    }

    private static List<Skill> GoalSkillList(params Skill?[] skills) =>
        skills.Where(s => s != null).Select(s => s!).ToList();

    private static CycleEvaluationBlockDto BuildEvaluationBlock(
        int cycleId, string name, DateTime start, DateTime endInclusive,
        List<Skill> goalSkills, List<Appointment> teamAppointments)
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

        var skillIds = goalSkills.Select(s => s.Id).ToList();
        var totalMinutes = withTraining.Sum(a => a.Training!.GetActivitiesDuration());
        var matchedMinutes = withTraining.Sum(a => a.Training!.GetActivitiesDurationForSkills(skillIds));

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
            PerSkill = goalSkills.Select(skill => new SkillCoverageDto
            {
                SkillId = skill.Id,
                SkillName = skill.Name,
                CategoryId = skill.SkillCategoryId,
                MatchedMinutes = withTraining.Sum(a => a.Training!.GetActivitiesDurationForSkills([skill.Id])),
                TrainingsCount = withTraining.Count(a => a.Training!.GetActivitiesDurationForSkills([skill.Id]) > 0)
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
            .Select(a => new AppointmentRefDto { Id = a.Id, Name = a.Name ?? string.Empty, Start = a.Start })
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

}
