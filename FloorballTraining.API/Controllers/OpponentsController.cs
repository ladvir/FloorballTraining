using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>Per-club catalog of opponent team names, picked when scheduling a Match appointment.</summary>
[Authorize]
public class OpponentsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService) : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private static OpponentDto ToDto(Opponent o) => new() { Id = o.Id, Name = o.Name, ClubId = o.ClubId };

    /// <summary>GET /opponents?clubId=X — list for the caller's club (admin may pass any clubId)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? clubId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        var effectiveClubId = roleInfo.EffectiveRole == "Admin" ? clubId ?? roleInfo.ClubId : roleInfo.ClubId;
        if (effectiveClubId == null) return Ok(Array.Empty<OpponentDto>());

        var opponents = await context.Opponents.AsNoTracking()
            .Where(o => o.ClubId == effectiveClubId.Value)
            .OrderBy(o => o.Name)
            .ToListAsync();
        return Ok(opponents.Select(ToDto));
    }

    public class CreateOpponentRequest
    {
        public string Name { get; set; } = string.Empty;
        public int? ClubId { get; set; }
    }

    /// <summary>
    /// POST /opponents — find-or-create by name (case-insensitive) within the club, so picking an
    /// unlisted opponent while scheduling a match never fails on a duplicate-name race.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOpponentRequest dto)
    {
        var name = dto.Name?.Trim();
        if (string.IsNullOrEmpty(name)) return BadRequest(new { message = "Zadejte název soupeře." });

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("Coach" or "HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();

        var clubId = roleInfo.EffectiveRole == "Admin" ? dto.ClubId ?? roleInfo.ClubId : roleInfo.ClubId;
        if (clubId == null) return BadRequest(new { message = "Není určen klub." });

        var existing = await context.Opponents
            .FirstOrDefaultAsync(o => o.ClubId == clubId.Value && o.Name.ToLower() == name.ToLower());
        if (existing != null) return Ok(ToDto(existing));

        var opponent = new Opponent { Name = name, ClubId = clubId.Value };
        context.Opponents.Add(opponent);
        await context.SaveChangesAsync();
        return Ok(ToDto(opponent));
    }

    public class UpdateOpponentRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>PUT /opponents/{id} — rename (HeadCoach+ only, own club)</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateOpponentRequest dto)
    {
        var name = dto.Name?.Trim();
        if (string.IsNullOrEmpty(name)) return BadRequest(new { message = "Zadejte název soupeře." });

        var opponent = await context.Opponents.FirstOrDefaultAsync(o => o.Id == id);
        if (opponent == null) return NotFound();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();
        if (roleInfo.EffectiveRole != "Admin" && opponent.ClubId != roleInfo.ClubId) return Forbid();

        opponent.Name = name;
        await context.SaveChangesAsync();
        return Ok(ToDto(opponent));
    }

    /// <summary>DELETE /opponents/{id} — HeadCoach+ only, own club. Appointments keep their history (FK set to null).</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var opponent = await context.Opponents.FirstOrDefaultAsync(o => o.Id == id);
        if (opponent == null) return NotFound();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin")) return Forbid();
        if (roleInfo.EffectiveRole != "Admin" && opponent.ClubId != roleInfo.ClubId) return Forbid();

        context.Opponents.Remove(opponent);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
