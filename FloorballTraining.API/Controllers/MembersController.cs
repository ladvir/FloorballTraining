using System.Security.Claims;
using ClosedXML.Excel;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Members.Interfaces;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class MembersController(
    IViewMembersAllUseCase viewMembersAllUseCase,
    IViewMemberByIdUseCase viewMemberByIdUseCase,
    IAddMemberUseCase addMemberUseCase,
    IEditMemberUseCase editMemberUseCase,
    IDeleteMemberUseCase deleteMemberUseCase,
    IMemberRepository memberRepository,
    IClubRoleService clubRoleService)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

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

        // Non-admin: force member into caller's active club
        if (roleInfo.EffectiveRole != "Admin" && roleInfo.ClubId.HasValue)
            dto.ClubId = roleInfo.ClubId.Value;

        await addMemberUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] MemberDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        await editMemberUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] MemberDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("ClubAdmin" or "Admin")) return Forbid();

        // ClubAdmin can only delete members in own club
        if (roleInfo.EffectiveRole == "ClubAdmin" && dto.ClubId != roleInfo.ClubId)
            return Forbid();

        await deleteMemberUseCase.ExecuteAsync(dto);
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

        // Non-admin: force import into caller's active club
        if (roleInfo.EffectiveRole != "Admin" && roleInfo.ClubId.HasValue)
            clubId = roleInfo.ClubId.Value;

        if (file == null || file.Length == 0)
            return BadRequest("Soubor je prázdný.");

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

        // Load existing members for this club
        var existingMembers = (await memberRepository.GetAllAsync())
            .Where(m => m.ClubId == clubId)
            .ToList();

        var imported = 0;
        var skipped = 0;
        var skippedNames = new List<string>();

        foreach (var (lastName, firstName, birthYear) in rows)
        {
            // Check for existing member: same FirstName + LastName + BirthYear in same club
            var exists = existingMembers.Any(m =>
                m.FirstName.Equals(firstName, StringComparison.OrdinalIgnoreCase) &&
                m.LastName.Equals(lastName, StringComparison.OrdinalIgnoreCase) &&
                m.BirthYear == birthYear);

            if (exists)
            {
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

            await memberRepository.AddMemberAsync(member);
            imported++;

            // If teamId specified, create TeamMember
            if (teamId.HasValue)
            {
                // Add to in-memory list for duplicate checking of newly added members
                existingMembers.Add(member);
            }
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
