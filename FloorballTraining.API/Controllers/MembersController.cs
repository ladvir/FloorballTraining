using System.Security.Claims;
using ClosedXML.Excel;
using FloorballTraining.API.Helpers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases.Members.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class MembersController(
    IViewMembersAllUseCase viewMembersAllUseCase,
    IViewMemberByIdUseCase viewMemberByIdUseCase,
    IAddMemberUseCase addMemberUseCase,
    IEditMemberUseCase editMemberUseCase,
    IDeleteMemberUseCase deleteMemberUseCase,
    IDbContextFactory<FloorballTrainingContext> dbContextFactory,
    IClubRoleService clubRoleService,
    IAuditService auditService,
    UserManager<AppUser> userManager,
    IConfiguration configuration)
    : BaseApiController
{
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

    // The Member record is the source of truth for a person's name. When a member shares an
    // email with a login account (AppUser), keep the account's name in sync with the member.
    // Best-effort: member save already committed before this runs, so failures are logged
    // and swallowed rather than propagated as 500.
    private async Task TrySyncUserNameFromMemberAsync(string? email, string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(email)) return;

        var newFirst = firstName.Trim();
        var newLast = lastName.Trim();
        // Don't overwrite the account name with a partial blank: require both parts present.
        if (newFirst.Length == 0 || newLast.Length == 0) return;

        try
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null) return;
            if (user.FirstName == newFirst && user.LastName == newLast) return;

            user.FirstName = newFirst;
            user.LastName = newLast;
            var result = await userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                HttpContext.RequestServices
                    .GetRequiredService<ILogger<MembersController>>()
                    .LogWarning("AppUser name sync failed for {Email}: {Errors}", email, errors);
            }
        }
        catch (Exception ex)
        {
            HttpContext.RequestServices
                .GetRequiredService<ILogger<MembersController>>()
                .LogWarning(ex, "AppUser name sync threw for {Email}; member save already committed", email);
        }
    }

    [HttpGet("{id:int}/attendance")]
    public async Task<IActionResult> GetMemberAttendance(int id)
    {
        await using var db = dbContextFactory.CreateDbContext();

        var member = await db.Members.Where(m => m.Id == id).Select(m => new { m.ClubId, m.AppUserId }).FirstOrDefaultAsync();
        if (member == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        var isOwner = member.AppUserId == userId;

        if (roleInfo.EffectiveRole != "Admin")
        {
            if (roleInfo.EffectiveRole is "Coach" or "HeadCoach" or "ClubAdmin")
            {
                if (member.ClubId != roleInfo.ClubId) return Forbid();
            }
            else if (!isOwner)
            {
                return Forbid();
            }
        }

        var records = await db.AppointmentAttendances
            .Where(a => a.MemberId == id)
            .Select(a => new MemberAttendanceRecordDto
            {
                Id = a.Id,
                AppointmentId = a.AppointmentId,
                AppointmentName = a.Appointment!.Name,
                AppointmentStart = a.Appointment.Start,
                Status = a.Status,
                Note = a.Note,
            })
            .OrderByDescending(a => a.AppointmentStart)
            .Take(50)
            .ToListAsync();

        var present = records.Count(r => r.Status == 1);
        var absent = records.Count(r => r.Status == 2);
        var excused = records.Count(r => r.Status == 3);
        var unknown = records.Count(r => r.Status == 0);
        var total = records.Count;
        var rate = total > 0 ? (int)Math.Round((double)present / total * 100) : 0;

        return Ok(new MemberAttendanceSummaryDto
        {
            MemberId = id,
            TotalEvents = total,
            Present = present,
            Absent = absent,
            Excused = excused,
            Unknown = unknown,
            AttendanceRate = rate,
            RecentRecords = records,
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await viewMembersAllUseCase.ExecuteAsync();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.ClubId.HasValue)
        {
            result = result.Where(m => m.ClubId == roleInfo.ClubId.Value).ToList();
        }

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewMemberByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();

        // Filter by active club (admin included)
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.ClubId.HasValue && result.ClubId != roleInfo.ClubId.Value)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] MemberDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        // Non-admin: force member into caller's active club; no ClubId = misconfigured account.
        if (roleInfo.EffectiveRole != "Admin")
        {
            if (!roleInfo.ClubId.HasValue) return Forbid();
            dto.ClubId = roleInfo.ClubId.Value;
        }

        await addMemberUseCase.ExecuteAsync(dto);
        await TrySyncUserNameFromMemberAsync(dto.Email, dto.FirstName, dto.LastName);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] MemberDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        if (roleInfo.EffectiveRole != "Admin")
        {
            if (!roleInfo.ClubId.HasValue) return Forbid();
            await using var db = await dbContextFactory.CreateDbContextAsync();
            var actualClubId = await db.Members
                .Where(m => m.Id == dto.Id)
                .Select(m => (int?)m.ClubId)
                .FirstOrDefaultAsync();
            if (actualClubId == null) return NotFound();
            if (actualClubId != roleInfo.ClubId) return Forbid();
        }

        await editMemberUseCase.ExecuteAsync(dto);
        await TrySyncUserNameFromMemberAsync(dto.Email, dto.FirstName, dto.LastName);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] MemberDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("ClubAdmin" or "Admin")) return Forbid();

        int? auditClubId = dto.ClubId;
        if (roleInfo.EffectiveRole != "Admin")
        {
            await using var db = await dbContextFactory.CreateDbContextAsync();
            var actualClubId = await db.Members
                .Where(m => m.Id == dto.Id)
                .Select(m => (int?)m.ClubId)
                .FirstOrDefaultAsync();
            if (actualClubId == null) return NotFound();
            if (actualClubId != roleInfo.ClubId) return Forbid();
            auditClubId = actualClubId;
        }

        await deleteMemberUseCase.ExecuteAsync(dto);
        await auditService.LogAsync(AuditActions.MemberDeleted, "Member", dto.Id.ToString(),
            details: new { name = $"{dto.FirstName} {dto.LastName}".Trim(), clubId = auditClubId });
        return NoContent();
    }

    [HttpPost("import-excel")]
    public async Task<IActionResult> ImportExcel(
        IFormFile file,
        [FromQuery] int clubId,
        [FromQuery] int? teamId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        // Non-admin: force import into caller's active club; no ClubId = misconfigured account.
        if (roleInfo.EffectiveRole != "Admin")
        {
            if (!roleInfo.ClubId.HasValue) return Forbid();
            clubId = roleInfo.ClubId.Value;
        }

        // Verify that teamId (if supplied) belongs to the import target club
        if (teamId.HasValue)
        {
            await using var verifyDb = await dbContextFactory.CreateDbContextAsync();
            var teamClubId = await verifyDb.Teams
                .Where(t => t.Id == teamId.Value)
                .Select(t => (int?)t.ClubId)
                .FirstOrDefaultAsync();
            if (teamClubId == null) return NotFound("Tým nenalezen.");
            if (teamClubId != clubId) return BadRequest("Tým nepatří do cílového klubu.");
        }

        var maxUploadBytes = configuration.GetValue<long?>("FileUpload:MaxBytes") ?? 10L * 1024 * 1024;
        switch (FileUploadValidator.Validate(file, maxUploadBytes, ExcelExtensions, ExcelContentTypes, ExcelSignatures))
        {
            case FileValidationResult.Empty:
                return BadRequest("Soubor je prázdný.");
            case FileValidationResult.TooLarge:
                return StatusCode(StatusCodes.Status413PayloadTooLarge,
                    $"Soubor je příliš velký. Maximální velikost je {maxUploadBytes / (1024 * 1024)} MB.");
            case FileValidationResult.UnsupportedType:
                return StatusCode(StatusCodes.Status415UnsupportedMediaType,
                    "Nepodporovaný typ souboru. Povolené jsou pouze soubory .xlsx a .xls.");
        }

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.First();

        var rows = new List<(string LastName, string FirstName, int BirthYear)>();
        var errors = new List<string>();

        // Find header row or start from row 1
        var startRow = 1;
        var firstCell = worksheet.Cell(1, 1).GetString().Trim().ToLower();
        if (firstCell is "příjmení" or "prijmeni" or "lastname" or "last name")
            startRow = 2; // skip header

        for (var row = startRow; row <= worksheet.LastRowUsed()?.RowNumber(); row++)
        {
            var lastName = worksheet.Cell(row, 1).GetString().Trim();
            var firstName = worksheet.Cell(row, 2).GetString().Trim();
            var birthYearStr = worksheet.Cell(row, 3).GetString().Trim();

            if (string.IsNullOrWhiteSpace(lastName) && string.IsNullOrWhiteSpace(firstName))
                continue; // skip empty rows

            if (string.IsNullOrWhiteSpace(lastName))
            {
                errors.Add($"Řádek {row}: chybí příjmení.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(firstName))
            {
                errors.Add($"Řádek {row}: chybí jméno.");
                continue;
            }

            if (!int.TryParse(birthYearStr, out var birthYear) || birthYear < 1900 || birthYear > DateTime.Now.Year)
            {
                errors.Add($"Řádek {row}: neplatný ročník '{birthYearStr}'.");
                continue;
            }

            rows.Add((lastName, firstName, birthYear));
        }

        await using var db = await dbContextFactory.CreateDbContextAsync();

        // Push the club filter to the DB instead of loading the full member table.
        var existingMembers = await db.Members
            .Where(m => m.ClubId == clubId)
            .ToListAsync();

        var imported = 0;
        var skipped = 0;
        var skippedNames = new List<string>();
        var newMembers = new List<Member>();
        var existingMembersToEnroll = new List<Member>();

        foreach (var (lastName, firstName, birthYear) in rows)
        {
            // Check for existing member: same FirstName + LastName + BirthYear in same club.
            // existingMembers tracks both DB rows AND members added earlier in this batch.
            var existingMember = existingMembers.FirstOrDefault(m =>
                m.FirstName.Equals(firstName, StringComparison.OrdinalIgnoreCase) &&
                m.LastName.Equals(lastName, StringComparison.OrdinalIgnoreCase) &&
                m.BirthYear == birthYear);

            if (existingMember != null)
            {
                // If the member already exists in the DB (Id > 0) and a team was specified,
                // enroll them too — skipping only means "don't re-insert", not "don't join team".
                if (teamId.HasValue && existingMember.Id > 0)
                    existingMembersToEnroll.Add(existingMember);
                skipped++;
                skippedNames.Add($"{lastName} {firstName} ({birthYear})");
                continue;
            }

            var member = new Member
            {
                FirstName = firstName,
                LastName = lastName,
                BirthYear = birthYear,
                IsActive = true,
                Email = string.Empty,
                ClubId = clubId
            };

            db.Members.Add(member);
            newMembers.Add(member);
            existingMembers.Add(member); // track immediately so same-batch duplicates are caught
            imported++;
        }

        if (newMembers.Count > 0 || existingMembersToEnroll.Count > 0)
        {
            await using var transaction = await db.Database.BeginTransactionAsync();

            if (newMembers.Count > 0)
                await db.SaveChangesAsync(); // populates Member.Id for each new member

            if (teamId.HasValue)
            {
                // Avoid duplicate TeamMember rows for members already on this team.
                var alreadyInTeam = (await db.TeamMembers
                    .Where(t => t.TeamId == teamId.Value)
                    .Select(t => t.MemberId)
                    .ToListAsync()).ToHashSet();

                db.TeamMembers.AddRange(
                    newMembers.Concat(existingMembersToEnroll)
                        .Where(m => !alreadyInTeam.Contains(m.Id))
                        .Select(m => new TeamMember
                        {
                            TeamId = teamId.Value,
                            MemberId = m.Id,
                            IsPlayer = true,
                            IsCoach = false,
                        }));
                await db.SaveChangesAsync();
            }

            await transaction.CommitAsync();
        }

        return Ok(new
        {
            totalRead = rows.Count,
            imported,
            skipped,
            skippedNames,
            errors
        });
    }
}
