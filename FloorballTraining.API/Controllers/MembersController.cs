using System.Security.Claims;
using ClosedXML.Excel;
using FloorballTraining.API.Dtos.Members;
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
    ICredentialsEmailService credentialsEmailService,
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

    /// <summary>GET /members/{id}/teams — teams the member belongs to (lightweight; for team-average scoping).</summary>
    [HttpGet("{id:int}/teams")]
    public async Task<IActionResult> GetMemberTeams(int id)
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

        var teams = await db.TeamMembers
            .Where(tm => tm.MemberId == id && tm.TeamId != null)
            .Select(tm => new MemberTeamDto
            {
                Id = tm.TeamId!.Value,
                Name = tm.Team!.Name,
                IsPlayer = tm.IsPlayer,
                IsCoach = tm.IsCoach,
            })
            .OrderBy(t => t.Name)
            .ToListAsync();

        return Ok(teams);
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

        // Enrich with linked-account status so the UI can show/manage the login.
        if (!string.IsNullOrEmpty(result.AppUserId))
        {
            var appUser = await userManager.FindByIdAsync(result.AppUserId);
            if (appUser != null)
            {
                result.HasLogin = true;
                result.AppUserEmail = appUser.Email;
                result.LastLoginAt = appUser.LastLoginAt;
                result.PreferredLanguage = appUser.PreferredLanguage;
            }
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add(
        [FromBody] MemberDto dto,
        [FromQuery] bool createLogin = true,
        [FromQuery] bool sendCredentials = false,
        [FromQuery] string? language = null)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        // Non-admin: force member into caller's active club; no ClubId = misconfigured account.
        if (roleInfo.EffectiveRole != "Admin")
        {
            if (!roleInfo.ClubId.HasValue) return Forbid();
            dto.ClubId = roleInfo.ClubId.Value;
        }

        // A new member with an e-mail gets a login account straight away: link an
        // existing account with that e-mail, otherwise create one. Members without an
        // e-mail stay roster-only (a login can be created later from the account panel).
        string? generatedPassword = null;
        var createdNewUser = false;
        if (createLogin && !string.IsNullOrWhiteSpace(dto.Email) && string.IsNullOrEmpty(dto.AppUserId))
        {
            var existing = await userManager.FindByEmailAsync(dto.Email);
            if (existing != null)
            {
                // Don't hijack an account already tied to a member in this club.
                await using var linkDb = await dbContextFactory.CreateDbContextAsync();
                var takenHere = await linkDb.Members
                    .AnyAsync(m => m.AppUserId == existing.Id && m.ClubId == dto.ClubId);
                if (!takenHere)
                    dto.AppUserId = existing.Id;
            }
            else
            {
                generatedPassword = PasswordGenerator.GenerateTemporary();
                var lang = (language ?? string.Empty).Trim().ToLowerInvariant();
                var user = new AppUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    FirstName = dto.FirstName?.Trim() ?? string.Empty,
                    LastName = dto.LastName?.Trim() ?? string.Empty,
                    DefaultClubId = dto.ClubId,
                    PreferredLanguage = lang.Length is >= 2 and <= 5 ? lang : null,
                };
                var createResult = await userManager.CreateAsync(user, generatedPassword);
                if (!createResult.Succeeded)
                    return BadRequest(new { message = string.Join("; ", createResult.Errors.Select(e => e.Description)) });
                await userManager.AddToRoleAsync(user, "User");
                dto.AppUserId = user.Id;
                createdNewUser = true;
            }
        }

        await addMemberUseCase.ExecuteAsync(dto);
        await TrySyncUserNameFromMemberAsync(dto.Email, dto.FirstName, dto.LastName);

        if (createdNewUser)
        {
            await auditService.LogAsync(AuditActions.MemberLoginCreated, "Member", dto.Id.ToString(),
                details: new { email = dto.Email, clubId = dto.ClubId });
            if (sendCredentials)
            {
                try
                {
                    await credentialsEmailService.SendWelcomeAsync(dto.Email, dto.FirstName, generatedPassword!);
                }
                catch (Exception ex)
                {
                    HttpContext.RequestServices.GetRequiredService<ILogger<MembersController>>()
                        .LogError(ex, "Failed to send credentials email after creating login for new member {MemberId}", dto.Id);
                }
            }
        }

        // Reveal the generated password only when it wasn't e-mailed, so the manager can pass it on.
        return Ok(new
        {
            memberId = dto.Id,
            appUserId = dto.AppUserId,
            loginCreated = createdNewUser,
            password = createdNewUser && !sendCredentials ? generatedPassword : null,
        });
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

    // Can the caller manage member↔account links for a member in the given club?
    // Admin anywhere; ClubAdmin/HeadCoach only within their active club.
    private async Task<bool> CanManageLinkAsync(int memberClubId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole == "Admin") return true;
        if (roleInfo.EffectiveRole is "HeadCoach" or "ClubAdmin")
            return roleInfo.ClubId == memberClubId;
        return false;
    }

    /// <summary>POST /members/{id}/link-user — link a roster member to an existing login account.</summary>
    [HttpPost("{id:int}/link-user")]
    public async Task<IActionResult> LinkUser(int id, [FromBody] LinkUserRequest request)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var member = await db.Members.FirstOrDefaultAsync(m => m.Id == id);
        if (member == null) return NotFound();
        if (!await CanManageLinkAsync(member.ClubId)) return Forbid();

        if (!string.IsNullOrEmpty(member.AppUserId))
            return BadRequest(new { message = "Člen je již propojen s účtem." });

        var user = await userManager.FindByIdAsync(request.UserId);
        if (user == null) return NotFound(new { message = "Uživatel nenalezen." });

        // A user may hold at most one member per club.
        var alreadyInClub = await db.Members
            .AnyAsync(m => m.AppUserId == request.UserId && m.ClubId == member.ClubId);
        if (alreadyInClub)
            return BadRequest(new { message = "Uživatel už má člena v tomto klubu." });

        member.AppUserId = user.Id;
        await db.SaveChangesAsync();
        await auditService.LogAsync(AuditActions.MemberLinkedToUser, "Member", id.ToString(),
            details: new { linkedUser = user.Email, clubId = member.ClubId });
        return NoContent();
    }

    /// <summary>DELETE /members/{id}/link-user — unlink the account; both records remain.</summary>
    [HttpDelete("{id:int}/link-user")]
    public async Task<IActionResult> UnlinkUser(int id)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var member = await db.Members.FirstOrDefaultAsync(m => m.Id == id);
        if (member == null) return NotFound();
        if (!await CanManageLinkAsync(member.ClubId)) return Forbid();

        if (string.IsNullOrEmpty(member.AppUserId))
            return BadRequest(new { message = "Člen nemá propojený účet." });

        var previousUserId = member.AppUserId;
        member.AppUserId = null;
        await db.SaveChangesAsync();
        await auditService.LogAsync(AuditActions.MemberUnlinkedFromUser, "Member", id.ToString(),
            details: new { previousUserId, clubId = member.ClubId });
        return NoContent();
    }

    /// <summary>POST /members/{id}/create-login — create a login account from the member and link it.</summary>
    [HttpPost("{id:int}/create-login")]
    public async Task<IActionResult> CreateLogin(int id, [FromBody] CreateLoginRequest request)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var member = await db.Members.FirstOrDefaultAsync(m => m.Id == id);
        if (member == null) return NotFound();
        if (!await CanManageLinkAsync(member.ClubId)) return Forbid();

        if (!string.IsNullOrEmpty(member.AppUserId))
            return BadRequest(new { message = "Člen je již propojen s účtem." });
        if (string.IsNullOrWhiteSpace(member.Email))
            return BadRequest(new { message = "Člen nemá vyplněný email." });
        if (await userManager.FindByEmailAsync(member.Email) != null)
            return BadRequest(new { message = "Email je již registrován." });

        var password = string.IsNullOrWhiteSpace(request.Password)
            ? PasswordGenerator.GenerateTemporary()
            : request.Password;

        var lang = (request.Language ?? string.Empty).Trim().ToLowerInvariant();
        var user = new AppUser
        {
            UserName = member.Email,
            Email = member.Email,
            FirstName = member.FirstName,
            LastName = member.LastName,
            DefaultClubId = member.ClubId,
            PreferredLanguage = lang.Length is >= 2 and <= 5 ? lang : null,
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
            return BadRequest(new { message = string.Join("; ", createResult.Errors.Select(e => e.Description)) });

        await userManager.AddToRoleAsync(user, "User");

        member.AppUserId = user.Id;
        await db.SaveChangesAsync();

        if (request.SendCredentials)
        {
            try
            {
                await credentialsEmailService.SendWelcomeAsync(member.Email, member.FirstName, password);
            }
            catch (Exception ex)
            {
                HttpContext.RequestServices.GetRequiredService<ILogger<MembersController>>()
                    .LogError(ex, "Failed to send credentials email after creating login for member {MemberId}", id);
            }
        }

        await auditService.LogAsync(AuditActions.MemberLoginCreated, "Member", id.ToString(),
            details: new { email = member.Email, clubId = member.ClubId });

        // Return the generated password only when it was auto-generated and not emailed,
        // so the manager can pass it on. Never echo a caller-supplied password.
        var revealPassword = string.IsNullOrWhiteSpace(request.Password) && !request.SendCredentials;
        return Ok(new
        {
            userId = user.Id,
            email = user.Email,
            password = revealPassword ? password : null,
        });
    }

    /// <summary>PUT /members/{id}/roster — update a member's roster fields (birth year, gender, active).</summary>
    [HttpPut("{id:int}/roster")]
    public async Task<IActionResult> UpdateRoster(int id, [FromBody] UpdateRosterRequest request)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var member = await db.Members.FirstOrDefaultAsync(m => m.Id == id);
        if (member == null) return NotFound();
        if (!await CanManageLinkAsync(member.ClubId)) return Forbid();

        if (request.BirthYear is < 1900 || request.BirthYear > DateTime.Now.Year)
            return BadRequest(new { message = "Neplatný ročník narození." });

        member.BirthYear = request.BirthYear;
        member.Gender = request.Gender.HasValue ? (CoreBusiness.Enums.Gender)request.Gender.Value : null;
        member.IsActive = request.IsActive;
        await db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>GET /members/{id}/link-candidates?q= — users that can be linked to this member.</summary>
    [HttpGet("{id:int}/link-candidates")]
    public async Task<IActionResult> GetLinkCandidates(int id, [FromQuery] string? q)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var member = await db.Members.FirstOrDefaultAsync(m => m.Id == id);
        if (member == null) return NotFound();
        if (!await CanManageLinkAsync(member.ClubId)) return Forbid();

        // Users already holding a member in this club are ineligible (one member per club).
        var takenUserIds = await db.Members
            .Where(m => m.ClubId == member.ClubId && m.AppUserId != null)
            .Select(m => m.AppUserId!)
            .ToListAsync();
        var taken = takenUserIds.ToHashSet();

        var query = userManager.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(u =>
                (u.Email != null && u.Email.Contains(term)) ||
                u.FirstName.Contains(term) ||
                u.LastName.Contains(term));
        }

        var candidates = (await query.OrderBy(u => u.LastName).Take(50).ToListAsync())
            .Where(u => !taken.Contains(u.Id))
            .Take(20)
            .Select(u => new LinkCandidateDto
            {
                UserId = u.Id,
                Email = u.Email ?? string.Empty,
                FirstName = u.FirstName,
                LastName = u.LastName,
            })
            .ToList();

        return Ok(candidates);
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
            // SQL Server runs with a retrying execution strategy — a manual transaction
            // must execute inside strategy.ExecuteAsync as one retriable unit.
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
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
            });
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
