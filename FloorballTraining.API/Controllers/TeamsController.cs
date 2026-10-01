using System.Globalization;
using System.Security.Claims;
using ClosedXML.Excel;
using FloorballTraining.API.Caching;
using FloorballTraining.API.Controllers.Requests;
using FloorballTraining.API.Helpers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Teams.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class TeamsController(
    IViewTeamsAllUseCase viewTeamsAllUseCase,
    IViewTeamByIdUseCase viewTeamByIdUseCase,
    IAddTeamUseCase addTeamUseCase,
    IEditTeamUseCase editTeamUseCase,
    IDeleteTeamUseCase deleteTeamUseCase,
    IClubRoleService clubRoleService,
    ITeamRepository teamRepository,
    ITeamMemberRepository teamMemberRepository,
    IMemberRepository memberRepository,
    IAuditService auditService,
    IConfiguration configuration,
    IReferenceCache referenceCache,
    FloorballTrainingContext context)
    : BaseApiController
{
    private const string AttendanceImportSheetName = "docházka běžných členů";

    private static readonly IReadOnlySet<string> ExcelExtensions =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".xlsx", ".xls" };

    private static readonly IReadOnlySet<string> ExcelContentTypes = new HashSet<string>
    {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/octet-stream"
    };

    private static readonly IReadOnlyList<byte[]> ExcelSignatures = new[]
    {
        new byte[] { 0x50, 0x4B, 0x03, 0x04 },                         // xlsx (ZIP)
        new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 }  // xls (OLE2)
    };

    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await viewTeamsAllUseCase.ExecuteAsync();
        var userId = GetCurrentUserId()!;

        // Guardian (parent, #102): sees only their children's teams (across clubs) so the events
        // page can filter between them (#104).
        if (await context.IsGuardianAsync(userId))
        {
            var childIds = await context.MemberGuardians
                .Where(g => g.GuardianAppUserId == userId)
                .Select(g => g.MemberId)
                .ToListAsync();
            var teamIds = await context.TeamMembers
                .Where(tm => childIds.Contains(tm.MemberId) && tm.TeamId.HasValue)
                .Select(tm => tm.TeamId!.Value)
                .Distinct()
                .ToListAsync();
            return Ok(result.Where(t => teamIds.Contains(t.Id)).ToList());
        }

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.ClubId.HasValue)
        {
            result = result.Where(t => t.ClubId == roleInfo.ClubId.Value).ToList();
        }

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewTeamByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();

        // Filter by active club (admin included)
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.ClubId.HasValue && result.ClubId != roleInfo.ClubId.Value)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] TeamDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        // Non-admin: force team into caller's active club
        if (roleInfo.EffectiveRole != "Admin" && roleInfo.ClubId.HasValue)
            dto.ClubId = roleInfo.ClubId.Value;

        await addTeamUseCase.ExecuteAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] TeamDto dto, [FromServices] FloorballTrainingContext context)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        if (roleInfo.EffectiveRole != "Admin")
        {
            var team = await context.Teams.Where(t => t.Id == dto.Id).Select(t => new { t.ClubId }).FirstOrDefaultAsync();
            if (team == null) return NotFound();
            if (team.ClubId != roleInfo.ClubId) return Forbid();
        }

        await editTeamUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int teamId, [FromServices] FloorballTrainingContext context)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        if (roleInfo.EffectiveRole != "Admin")
        {
            var team = await context.Teams.Where(t => t.Id == teamId).Select(t => new { t.ClubId }).FirstOrDefaultAsync();
            if (team == null) return NotFound();
            if (team.ClubId != roleInfo.ClubId) return Forbid();
        }

        await deleteTeamUseCase.ExecuteAsync(teamId);
        return NoContent();
    }

    [HttpPost("{id}/copy-to-season")]
    public async Task<IActionResult> CopyToSeason(
        int id,
        [FromBody] CopyTeamToSeasonRequest request,
        [FromServices] FloorballTrainingContext context)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var sourceTeam = await teamRepository.GetTeamByIdAsync(id);
        if (sourceTeam == null) return NotFound("Tým nenalezen.");

        if (roleInfo.EffectiveRole != "Admin" && sourceTeam.ClubId != roleInfo.ClubId) return Forbid();

        // Use caller's active club; admin can keep source club
        var clubId = roleInfo.EffectiveRole != "Admin" && roleInfo.ClubId.HasValue
            ? roleInfo.ClubId.Value
            : sourceTeam.ClubId;

        var newTeam = new Team
        {
            Name = string.IsNullOrWhiteSpace(request.NewName) ? sourceTeam.Name : request.NewName,
            AgeGroupId = sourceTeam.AgeGroupId,
            ClubId = clubId,
            SeasonId = request.SeasonId,
            PersonsMin = sourceTeam.PersonsMin,
            PersonsMax = sourceTeam.PersonsMax,
            DefaultTrainingDuration = sourceTeam.DefaultTrainingDuration,
            MaxTrainingDuration = sourceTeam.MaxTrainingDuration,
            MaxTrainingPartDuration = sourceTeam.MaxTrainingPartDuration,
            MinPartsDurationPercent = sourceTeam.MinPartsDurationPercent,
        };

        await teamRepository.AddTeamAsync(newTeam);

        // Copy team members
        if (request.CopyMembers && sourceTeam.TeamMembers.Count > 0)
        {
            foreach (var tm in sourceTeam.TeamMembers)
            {
                var newTm = new TeamMember
                {
                    TeamId = newTeam.Id,
                    MemberId = tm.MemberId,
                    IsCoach = tm.IsCoach,
                    IsPlayer = tm.IsPlayer
                };
                await teamMemberRepository.AddTeamMemberAsync(newTm);
            }
        }

        // Copy the season plan skeleton, shifted by the difference of the season starts
        if (request.CopyPlan)
        {
            var sourceMesocycles = await context.Mesocycles
                .Include(m => m.Microcycles)
                .Where(m => m.TeamId == id)
                .ToListAsync();

            if (sourceMesocycles.Count > 0)
            {
                var sourceSeasonStart = sourceTeam.SeasonId.HasValue
                    ? await context.Seasons
                        .Where(s => s.Id == sourceTeam.SeasonId.Value)
                        .Select(s => (DateTime?)s.StartDate)
                        .FirstOrDefaultAsync()
                    : null;
                var targetSeasonStart = await context.Seasons
                    .Where(s => s.Id == request.SeasonId)
                    .Select(s => (DateTime?)s.StartDate)
                    .FirstOrDefaultAsync();
                var delta = sourceSeasonStart.HasValue && targetSeasonStart.HasValue
                    ? targetSeasonStart.Value.Date - sourceSeasonStart.Value.Date
                    : TimeSpan.Zero;

                foreach (var meso in sourceMesocycles)
                {
                    context.Mesocycles.Add(new Mesocycle
                    {
                        TeamId = newTeam.Id,
                        Name = meso.Name,
                        Phase = meso.Phase,
                        StartDate = meso.StartDate + delta,
                        EndDate = meso.EndDate + delta,
                        Goal = meso.Goal,
                        GoalSkill1Id = meso.GoalSkill1Id,
                        GoalSkill2Id = meso.GoalSkill2Id,
                        GoalSkill3Id = meso.GoalSkill3Id,
                        Microcycles = meso.Microcycles.Select(mc => new Microcycle
                        {
                            Name = mc.Name,
                            Type = mc.Type,
                            StartDate = mc.StartDate + delta,
                            EndDate = mc.EndDate + delta,
                            Goal = mc.Goal,
                            GoalSkill1Id = mc.GoalSkill1Id,
                            GoalSkill2Id = mc.GoalSkill2Id,
                            GoalSkill3Id = mc.GoalSkill3Id,
                        }).ToList()
                    });
                }

                await context.SaveChangesAsync();
            }
        }

        return Ok(new { newTeamId = newTeam.Id });
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(int id, [FromBody] AddTeamMemberRequest request)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var team = await teamRepository.GetTeamByIdAsync(id);
        if (team == null) return NotFound("Tým nenalezen.");

        if (roleInfo.EffectiveRole != "Admin" && team.ClubId != roleInfo.ClubId) return Forbid();

        if (team.TeamMembers.Any(tm => tm.MemberId == request.MemberId))
            return BadRequest("Člen je již v tomto týmu.");

        if (request.IsCoach)
        {
            var member = await memberRepository.GetMemberByIdAsync(request.MemberId);
            if (member == null) return NotFound("Člen nenalezen.");
            if (!member.HasClubRoleCoach && !member.HasClubRoleMainCoach && !member.HasClubRoleClubAdmin)
                return BadRequest("Člen nemá v klubu roli trenéra. Nelze ho přidat do týmu jako trenéra.");
        }

        var tm = new TeamMember
        {
            TeamId = id,
            MemberId = request.MemberId,
            IsCoach = request.IsCoach,
            IsPlayer = request.IsPlayer
        };
        await teamMemberRepository.AddTeamMemberAsync(tm);
        return Ok(new { id = tm.Id });
    }

    // Update roles (player/coach) for a member already in the team — lets e.g. a coach also be
    // added as a player, or a club manager also be marked as coach, without remove+re-add.
    [HttpPut("{id}/members/{memberId}")]
    public async Task<IActionResult> UpdateMember(int id, int memberId, [FromBody] AddTeamMemberRequest request)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var team = await teamRepository.GetTeamByIdAsync(id);
        if (team == null) return NotFound("Tým nenalezen.");

        if (roleInfo.EffectiveRole != "Admin" && team.ClubId != roleInfo.ClubId) return Forbid();

        var tm = team.TeamMembers.FirstOrDefault(t => t.MemberId == memberId);
        if (tm == null) return NotFound("Člen v tomto týmu nenalezen.");

        if (request.IsCoach)
        {
            var member = await memberRepository.GetMemberByIdAsync(memberId);
            if (member == null) return NotFound("Člen nenalezen.");
            if (!member.HasClubRoleCoach && !member.HasClubRoleMainCoach && !member.HasClubRoleClubAdmin)
                return BadRequest("Člen nemá v klubu roli trenéra. Nelze ho přidat do týmu jako trenéra.");
        }

        // Build a detached entity rather than mutating tm in place — it carries Team/Member
        // navigation properties fixed up by EF from a different DbContext than the one
        // UpdateTeamMemberAsync uses, which would otherwise throw a cross-context tracking error.
        await teamMemberRepository.UpdateTeamMemberAsync(new TeamMember
        {
            Id = tm.Id,
            TeamId = id,
            MemberId = memberId,
            IsCoach = request.IsCoach,
            IsPlayer = request.IsPlayer
        });
        return NoContent();
    }

    [HttpDelete("{id}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(int id, int memberId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var team = await teamRepository.GetTeamByIdAsync(id);
        if (team == null) return NotFound("Tým nenalezen.");

        if (roleInfo.EffectiveRole != "Admin" && team.ClubId != roleInfo.ClubId) return Forbid();

        var tm = team.TeamMembers.FirstOrDefault(t => t.MemberId == memberId);
        if (tm == null) return NotFound("Člen v tomto týmu nenalezen.");

        await teamMemberRepository.DeleteTeamMemberAsync(tm);
        return NoContent();
    }

    [HttpPost("{id}/import-ical")]
    public async Task<IActionResult> ImportICal(
        int id,
        [FromBody] ICalImportFilterRequest? request,
        [FromServices] IICalImportService iCalImportService,
        [FromServices] FloorballTrainingContext context)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        if (roleInfo.EffectiveRole != "Admin")
        {
            var team = await context.Teams.Where(t => t.Id == id).Select(t => new { t.ClubId }).FirstOrDefaultAsync();
            if (team == null) return NotFound();
            if (team.ClubId != roleInfo.ClubId) return Forbid();
        }

        var result = await iCalImportService.ImportAsync(id, GetCurrentUserId()!, request?.From, request?.To, request?.Types);

        if (result.Errors.Count > 0 && result.Imported == 0 && result.Updated == 0)
            return BadRequest(new { message = string.Join("; ", result.Errors) });

        return Ok(result);
    }

    [HttpPost("{id}/calendar-token")]
    public async Task<IActionResult> GenerateCalendarToken(int id, [FromServices] FloorballTrainingContext context)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var team = await context.Teams.FirstOrDefaultAsync(t => t.Id == id);
        if (team == null) return NotFound();

        if (roleInfo.EffectiveRole != "Admin" && team.ClubId != roleInfo.ClubId) return Forbid();

        team.PublicCalendarToken = Guid.NewGuid().ToString("N");
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.CalendarTokenGenerated, "Team", id.ToString());

        return Ok(new { token = team.PublicCalendarToken });
    }

    [HttpDelete("{id}/calendar-token")]
    public async Task<IActionResult> RevokeCalendarToken(int id, [FromServices] FloorballTrainingContext context)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var team = await context.Teams.FirstOrDefaultAsync(t => t.Id == id);
        if (team == null) return NotFound();

        if (roleInfo.EffectiveRole != "Admin" && team.ClubId != roleInfo.ClubId) return Forbid();

        team.PublicCalendarToken = null;
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.CalendarTokenRevoked, "Team", id.ToString());

        return NoContent();
    }

    [HttpGet("{id}/attendance")]
    public async Task<IActionResult> GetTeamAttendance(int id, [FromServices] FloorballTrainingContext context)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin" or "Coach")) return Forbid();

        var team = await context.Teams.Select(t => new { t.Id, t.ClubId }).FirstOrDefaultAsync(t => t.Id == id);
        if (team == null) return NotFound();
        if (roleInfo.EffectiveRole != "Admin" && team.ClubId != roleInfo.ClubId) return Forbid();

        // Get appointments for this team that have attendance records (last 20 events)
        var appointmentIds = await context.AppointmentAttendances
            .Where(a => a.Appointment!.TeamId == id)
            .Select(a => a.AppointmentId)
            .Distinct()
            .ToListAsync();

        var appointments = await context.Appointments
            .Where(a => a.TeamId == id && appointmentIds.Contains(a.Id))
            .OrderByDescending(a => a.Start)
            .Take(20)
            .Select(a => new { a.Id, a.Name, a.Start })
            .ToListAsync();

        // Only count members who are currently on this team's roster and active — a former or
        // deactivated member's historical attendance rows shouldn't inflate this team's numbers.
        var activeTeamMemberIds = await context.TeamMembers
            .Where(tm => tm.TeamId == id && tm.Member!.IsActive)
            .Select(tm => tm.MemberId)
            .ToListAsync();

        var allAttendances = await context.AppointmentAttendances
            .Where(a =>
                a.Appointment!.TeamId == id
                && appointmentIds.Contains(a.AppointmentId)
                && activeTeamMemberIds.Contains(a.MemberId))
            .Select(a => new AppointmentAttendanceDto
            {
                Id = a.Id,
                AppointmentId = a.AppointmentId,
                MemberId = a.MemberId,
                MemberFirstName = a.Member!.FirstName,
                MemberLastName = a.Member.LastName,
                Status = a.Status,
                Note = a.Note,
                RecordedAt = a.RecordedAt,
            })
            .ToListAsync();

        var events = appointments.Select(apt =>
        {
            var memberAttendances = allAttendances.Where(a => a.AppointmentId == apt.Id).ToList();
            return new TeamAttendanceEventDto
            {
                AppointmentId = apt.Id,
                AppointmentName = apt.Name,
                AppointmentStart = apt.Start,
                Present = memberAttendances.Count(a => a.Status == 1),
                Absent = memberAttendances.Count(a => a.Status == 2),
                Excused = memberAttendances.Count(a => a.Status == 3),
                Unknown = memberAttendances.Count(a => a.Status == 0),
                Total = memberAttendances.Count,
                MemberAttendances = memberAttendances,
            };
        }).ToList();

        // Aggregate per-member stats
        var memberGroups = allAttendances
            .GroupBy(a => new { a.MemberId, a.MemberFirstName, a.MemberLastName })
            .Select(g =>
            {
                var present = g.Count(a => a.Status == 1);
                var total = g.Count();
                return new TeamMemberAttendanceSummaryDto
                {
                    MemberId = g.Key.MemberId,
                    MemberFirstName = g.Key.MemberFirstName,
                    MemberLastName = g.Key.MemberLastName,
                    Present = present,
                    Absent = g.Count(a => a.Status == 2),
                    Excused = g.Count(a => a.Status == 3),
                    Unknown = g.Count(a => a.Status == 0),
                    AttendanceRate = total > 0 ? (int)Math.Round((double)present / total * 100) : 0,
                };
            })
            .OrderBy(m => m.MemberLastName).ThenBy(m => m.MemberFirstName)
            .ToList();

        return Ok(new TeamAttendanceSummaryDto
        {
            TeamId = id,
            Events = events,
            Members = memberGroups,
        });
    }

    // ── EOS attendance import ───────────────────────────────────────────────────
    // Stateless two-phase flow: analyze parses + auto-matches everything it can and hands the
    // full result to the frontend; commit takes that same data back, augmented with the coach's
    // manual resolutions for whatever analyze couldn't match on its own. No server-side temp
    // storage between the two calls — the dataset (one team's export) is small enough to round-trip.

    private record ParsedAttendanceRow(
        string NameRaw, string FirstName, string LastName, int? BirthYear,
        bool Attended, string TypeRaw, DateTime Start, DateTime End, string? EventName);

    private static readonly string[] EosStartFormats = ["yyyy-MM-dd HH:mm", "yyyy-MM-dd HH:mm:ss"];

    private static (string LastName, string FirstName) SplitMemberName(string raw)
    {
        var parts = raw.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length < 2 ? (raw, "") : (string.Join(' ', parts[..^1]), parts[^1]);
    }

    private static AppointmentType? TryMapAppointmentType(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        foreach (var value in Enum.GetValues<AppointmentType>())
        {
            if (string.Equals(value.GetDescription(), raw, StringComparison.OrdinalIgnoreCase))
                return value;
        }
        return null;
    }

    // EOS carries no location — same "neznámé" placeholder Place as ICalImportService's
    // GetOrCreateDefaultPlace, so appointments created from either import land on one shared default.
    private async Task<int> GetOrCreateDefaultPlaceIdAsync()
    {
        const string defaultName = "Neznámé";
        var existingId = await context.Places
            .Where(p => p.Name == defaultName)
            .Select(p => (int?)p.Id)
            .FirstOrDefaultAsync();
        if (existingId.HasValue) return existingId.Value;

        var place = new Place { Name = defaultName };
        context.Places.Add(place);
        await context.SaveChangesAsync();
        referenceCache.Evict(ReferenceCacheKeys.PlacesAll);
        return place.Id;
    }

    [HttpPost("{id:int}/attendance/import-analyze")]
    public async Task<IActionResult> ImportAttendanceAnalyze(int id, IFormFile file)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var team = await context.Teams.Select(t => new { t.Id, t.ClubId }).FirstOrDefaultAsync(t => t.Id == id);
        if (team == null) return NotFound();
        if (roleInfo.EffectiveRole != "Admin" && team.ClubId != roleInfo.ClubId) return Forbid();

        var maxUploadBytes = configuration.GetValue<long?>("FileUpload:MaxBytes") ?? 10L * 1024 * 1024;
        switch (FileUploadValidator.Validate(file, maxUploadBytes, ExcelExtensions, ExcelContentTypes, ExcelSignatures))
        {
            case FileValidationResult.Empty:
                return BadRequest(new { message = "Soubor je prázdný." });
            case FileValidationResult.TooLarge:
                return StatusCode(StatusCodes.Status413PayloadTooLarge,
                    new { message = $"Soubor je příliš velký. Maximální velikost je {maxUploadBytes / (1024 * 1024)} MB." });
            case FileValidationResult.UnsupportedType:
                return StatusCode(StatusCodes.Status415UnsupportedMediaType,
                    new { message = "Nepodporovaný typ souboru. Povolené jsou pouze soubory .xlsx a .xls." });
        }

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.FirstOrDefault(w =>
            string.Equals(w.Name.Trim(), AttendanceImportSheetName, StringComparison.OrdinalIgnoreCase));
        if (worksheet == null)
            return BadRequest(new { message = $"List '{AttendanceImportSheetName}' nebyl v souboru nalezen." });

        if (!string.Equals(worksheet.Cell(1, 2).GetString().Trim(), "Člen", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Neočekávaný formát souboru — nebyl nalezen sloupec 'Člen'." });

        var parseErrors = new List<string>();
        var parsedRows = new List<ParsedAttendanceRow>();

        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 1;
        for (var row = 2; row <= lastRow; row++)
        {
            var nameRaw = worksheet.Cell(row, 2).GetString().Trim();
            if (string.IsNullOrWhiteSpace(nameRaw)) continue;

            var birthRaw = worksheet.Cell(row, 3).GetString().Trim();
            var attendedRaw = worksheet.Cell(row, 7).GetString().Trim();
            var typeRaw = worksheet.Cell(row, 9).GetString().Trim();
            var eventName = worksheet.Cell(row, 10).GetString().Trim();
            var startRaw = worksheet.Cell(row, 11).GetString().Trim();
            var endRaw = worksheet.Cell(row, 12).GetString().Trim();

            if (!DateTime.TryParseExact(startRaw, EosStartFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var start))
            {
                parseErrors.Add($"Řádek {row}: neplatný začátek události '{startRaw}'.");
                continue;
            }
            if (!DateTime.TryParseExact(endRaw, EosStartFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
                end = start.AddHours(1.5); // "Konec" missing/unparseable — fall back to a sensible default duration

            var (lastName, firstName) = SplitMemberName(nameRaw);
            if (string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName))
            {
                parseErrors.Add($"Řádek {row}: nepodařilo se rozpoznat jméno člena '{nameRaw}'.");
                continue;
            }

            var attended = attendedRaw.Equals("ano", StringComparison.OrdinalIgnoreCase);
            int? birthYear = DateTime.TryParseExact(birthRaw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var birthDate)
                ? birthDate.Year
                : null;

            parsedRows.Add(new ParsedAttendanceRow(nameRaw, firstName, lastName, birthYear, attended, typeRaw, start, end, eventName));
        }

        // Team roster + club-wide member maps, built once and reused across every event group.
        var teamMembers = await context.TeamMembers
            .Where(tm => tm.TeamId == id)
            .Select(tm => new { tm.MemberId, tm.Member!.FirstName, tm.Member.LastName })
            .ToListAsync();
        var teamRosterMap = teamMembers
            .GroupBy(m => (m.FirstName.Trim().ToLowerInvariant(), m.LastName.Trim().ToLowerInvariant()))
            .ToDictionary(g => g.Key, g => g.First().MemberId);

        var clubMembers = await context.Members
            .Where(m => m.ClubId == team.ClubId)
            .Select(m => new { m.Id, m.FirstName, m.LastName, m.BirthYear })
            .ToListAsync();

        int? FindClubSuggestion(string firstName, string lastName, int? birthYear)
        {
            var candidates = clubMembers
                .Where(m => m.FirstName.Equals(firstName, StringComparison.OrdinalIgnoreCase)
                            && m.LastName.Equals(lastName, StringComparison.OrdinalIgnoreCase))
                .ToList();
            if (candidates.Count == 0) return null;
            if (candidates.Count == 1) return candidates[0].Id;
            var byBirth = birthYear.HasValue ? candidates.FirstOrDefault(m => m.BirthYear == birthYear) : null;
            return (byBirth ?? candidates[0]).Id;
        }

        var eventDtos = new List<AttendanceImportEventDto>();
        // LINQ GroupBy preserves first-occurrence order of each key, so events come out in file order.
        foreach (var group in parsedRows.GroupBy(r => (r.TypeRaw, r.Start)))
        {
            var (typeRaw, start) = group.Key;
            var appointmentType = TryMapAppointmentType(typeRaw);

            var matches = await context.Appointments
                .Where(a => a.TeamId == id && a.Start == start && (appointmentType == null || a.AppointmentType == appointmentType))
                .Select(a => new { a.Id, a.Name })
                .ToListAsync();

            var eventDto = new AttendanceImportEventDto
            {
                EventTypeRaw = typeRaw,
                EventName = group.First().EventName,
                Start = start,
                End = group.First().End,
            };

            if (matches.Count == 1)
            {
                eventDto.MatchedAppointmentId = matches[0].Id;
                eventDto.MatchedAppointmentName = matches[0].Name;
            }
            else
            {
                eventDto.CandidateAppointments = await context.Appointments
                    .Where(a => a.TeamId == id && a.Start.Date == start.Date)
                    .OrderBy(a => a.Start)
                    .Select(a => new AttendanceImportCandidateAppointmentDto
                    {
                        Id = a.Id,
                        Name = a.Name,
                        AppointmentType = (int)a.AppointmentType,
                        Start = a.Start,
                    })
                    .ToListAsync();
            }

            var existingByMember = eventDto.MatchedAppointmentId.HasValue
                ? await context.AppointmentAttendances
                    .Where(a => a.AppointmentId == eventDto.MatchedAppointmentId.Value)
                    .Select(a => new AppointmentAttendanceDto
                    {
                        Id = a.Id,
                        AppointmentId = a.AppointmentId,
                        MemberId = a.MemberId,
                        MemberFirstName = a.Member!.FirstName,
                        MemberLastName = a.Member.LastName,
                        Status = a.Status,
                        Note = a.Note,
                        RecordedAt = a.RecordedAt,
                    })
                    .ToDictionaryAsync(a => a.MemberId)
                : new Dictionary<int, AppointmentAttendanceDto>();

            foreach (var row in group)
            {
                var key = (row.FirstName.Trim().ToLowerInvariant(), row.LastName.Trim().ToLowerInvariant());
                var memberDto = new AttendanceImportMemberRowDto { NameRaw = row.NameRaw, Attended = row.Attended };

                if (teamRosterMap.TryGetValue(key, out var matchedMemberId))
                {
                    memberDto.MatchedMemberId = matchedMemberId;
                    memberDto.MatchedMemberName = row.NameRaw;
                    if (existingByMember.TryGetValue(matchedMemberId, out var existing))
                        memberDto.Existing = existing;
                }
                else
                {
                    var suggestionId = FindClubSuggestion(row.FirstName, row.LastName, row.BirthYear);
                    if (suggestionId.HasValue)
                    {
                        memberDto.SuggestedClubMemberId = suggestionId;
                        memberDto.SuggestedClubMemberName = row.NameRaw;
                    }
                }

                eventDto.Members.Add(memberDto);
            }

            eventDtos.Add(eventDto);
        }

        return Ok(new AttendanceImportAnalyzeResultDto { Events = eventDtos, ParseErrors = parseErrors });
    }

    [HttpPost("{id:int}/attendance/import-commit")]
    public async Task<IActionResult> ImportAttendanceCommit(int id, [FromBody] AttendanceImportCommitRequestDto request)
    {
        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var team = await context.Teams.Select(t => new { t.Id, t.ClubId }).FirstOrDefaultAsync(t => t.Id == id);
        if (team == null) return NotFound();
        if (roleInfo.EffectiveRole != "Admin" && team.ClubId != roleInfo.ClubId) return Forbid();

        var result = new AttendanceImportCommitResultDto();

        // SQL Server runs with a retrying execution strategy — a manual transaction must
        // execute inside strategy.ExecuteAsync as one retriable unit.
        var strategy = context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync();

            var teamMemberIds = (await context.TeamMembers
                .Where(tm => tm.TeamId == id)
                .Select(tm => tm.MemberId)
                .ToListAsync())
                .ToHashSet();

            foreach (var eventCommit in request.Events)
            {
                int appointmentId;

                if (eventCommit.CreateNewAppointment)
                {
                    var newAppointment = new Appointment
                    {
                        Name = eventCommit.EventName,
                        AppointmentType = TryMapAppointmentType(eventCommit.EventTypeRaw) ?? AppointmentType.Training,
                        Start = eventCommit.Start,
                        End = eventCommit.End > eventCommit.Start ? eventCommit.End : eventCommit.Start.AddHours(1.5),
                        TeamId = id,
                        LocationId = await GetOrCreateDefaultPlaceIdAsync(),
                    };
                    context.Appointments.Add(newAppointment);
                    await context.SaveChangesAsync();
                    appointmentId = newAppointment.Id;
                    result.AppointmentsCreated++;
                }
                else if (eventCommit.AppointmentId is { } chosenId)
                {
                    var appointmentTeamId = await context.Appointments
                        .Where(a => a.Id == chosenId)
                        .Select(a => (int?)a.TeamId)
                        .FirstOrDefaultAsync();
                    if (appointmentTeamId != id)
                    {
                        result.Errors.Add($"Událost {chosenId} nepatří k tomuto týmu, přeskočeno.");
                        continue;
                    }
                    appointmentId = chosenId;

                    if (eventCommit.SyncAppointmentFromImport)
                    {
                        var appointment = await context.Appointments.FirstAsync(a => a.Id == appointmentId);
                        appointment.Name = eventCommit.EventName;
                        appointment.Start = eventCommit.Start;
                        appointment.End = eventCommit.End > eventCommit.Start ? eventCommit.End : appointment.End;
                        var mappedType = TryMapAppointmentType(eventCommit.EventTypeRaw);
                        if (mappedType.HasValue) appointment.AppointmentType = mappedType.Value;
                        await context.SaveChangesAsync();
                        result.AppointmentsSynced++;
                    }
                }
                else
                {
                    result.EventsSkipped++;
                    continue;
                }

                result.EventsMatched++;

                var currentAttendance = await context.AppointmentAttendances
                    .Where(a => a.AppointmentId == appointmentId)
                    .ToListAsync();

                foreach (var memberCommit in eventCommit.Members)
                {
                    int memberId;

                    switch (memberCommit.Action)
                    {
                        case AttendanceImportMemberAction.Skip:
                            result.AttendanceSkippedByChoice++;
                            continue;

                        case AttendanceImportMemberAction.CreateNew:
                            if (string.IsNullOrWhiteSpace(memberCommit.NewFirstName) || string.IsNullOrWhiteSpace(memberCommit.NewLastName))
                            {
                                result.Errors.Add($"{memberCommit.NameRaw}: chybí jméno/příjmení pro založení nového člena.");
                                continue;
                            }
                            var newMember = new Member
                            {
                                FirstName = memberCommit.NewFirstName.Trim(),
                                LastName = memberCommit.NewLastName.Trim(),
                                IsActive = true,
                                Email = string.Empty,
                                ClubId = team.ClubId,
                            };
                            context.Members.Add(newMember);
                            await context.SaveChangesAsync();
                            memberId = newMember.Id;
                            context.TeamMembers.Add(new TeamMember { TeamId = id, MemberId = memberId, IsPlayer = true });
                            teamMemberIds.Add(memberId);
                            result.MembersCreated++;
                            result.MembersAddedToTeam++;
                            break;

                        case AttendanceImportMemberAction.UseExisting:
                            if (memberCommit.MemberId is not { } existingMemberId)
                            {
                                result.Errors.Add($"{memberCommit.NameRaw}: nebyl vybrán člen klubu.");
                                continue;
                            }
                            var memberClubId = await context.Members
                                .Where(m => m.Id == existingMemberId)
                                .Select(m => (int?)m.ClubId)
                                .FirstOrDefaultAsync();
                            if (memberClubId != team.ClubId)
                            {
                                result.Errors.Add($"{memberCommit.NameRaw}: vybraný člen nepatří do klubu.");
                                continue;
                            }
                            memberId = existingMemberId;
                            if (!teamMemberIds.Contains(memberId))
                            {
                                context.TeamMembers.Add(new TeamMember { TeamId = id, MemberId = memberId, IsPlayer = true });
                                teamMemberIds.Add(memberId);
                                result.MembersAddedToTeam++;
                            }
                            break;

                        default:
                            continue;
                    }

                    var existingAttendance = currentAttendance.FirstOrDefault(a => a.MemberId == memberId);
                    if (existingAttendance != null)
                    {
                        if (!eventCommit.UpdateAllExistingAttendance)
                        {
                            result.AttendanceSkippedConflict++;
                            continue;
                        }
                        existingAttendance.Status = memberCommit.Attended ? 1 : 2;
                        existingAttendance.RecordedByUserId = userId;
                        existingAttendance.RecordedAt = DateTime.UtcNow;
                        result.AttendanceUpdated++;
                    }
                    else
                    {
                        context.AppointmentAttendances.Add(new AppointmentAttendance
                        {
                            AppointmentId = appointmentId,
                            MemberId = memberId,
                            Status = memberCommit.Attended ? 1 : 2,
                            RecordedByUserId = userId,
                            RecordedAt = DateTime.UtcNow,
                        });
                        result.AttendanceCreated++;
                    }
                }

                await context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
        });

        await auditService.LogAsync(AuditActions.AttendanceImported, "Team", id.ToString(), details: new
        {
            result.EventsMatched,
            result.EventsSkipped,
            result.AppointmentsCreated,
            result.AppointmentsSynced,
            result.MembersCreated,
            result.MembersAddedToTeam,
            result.AttendanceCreated,
            result.AttendanceUpdated,
            result.AttendanceSkippedConflict,
        });

        return Ok(result);
    }
}
