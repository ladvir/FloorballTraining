using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Seasons.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class SeasonsController(
    IViewSeasonsAllUseCase viewSeasonsAllUseCase,
    IViewSeasonByIdUseCase viewSeasonByIdUseCase,
    IAddSeasonUseCase addSeasonUseCase,
    IEditSeasonUseCase editSeasonUseCase,
    IDeleteSeasonUseCase deleteSeasonUseCase,
    IClubRoleService clubRoleService)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("all")]
    public async Task<IActionResult> GetAll([FromQuery] int? clubId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);

        // Non-admin users can only see seasons of their active club
        if (roleInfo.EffectiveRole != "Admin")
        {
            clubId = roleInfo.ClubId;
        }

        var result = await viewSeasonsAllUseCase.ExecuteAsync(clubId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewSeasonByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole != "Admin" && result.ClubId != roleInfo.ClubId)
            return NotFound();

        return Ok(result);
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] SeasonDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        // Non-admin: force season into caller's active club
        if (roleInfo.EffectiveRole != "Admin" && roleInfo.ClubId.HasValue)
            dto.ClubId = roleInfo.ClubId.Value;

        await addSeasonUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut("edit")]
    public async Task<IActionResult> Edit([FromBody] SeasonDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        // Non-admin: force season into caller's active club
        if (roleInfo.EffectiveRole != "Admin" && roleInfo.ClubId.HasValue)
            dto.ClubId = roleInfo.ClubId.Value;

        await editSeasonUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete("delete/{seasonId}")]
    public async Task<IActionResult> Delete(string seasonId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        if (int.TryParse(seasonId, out var id))
        {
            // Non-admin: verify the season belongs to their club
            if (roleInfo.EffectiveRole != "Admin")
            {
                var season = await viewSeasonByIdUseCase.ExecuteAsync(id);
                if (season == null || season.ClubId != roleInfo.ClubId)
                    return Forbid();
            }

            await deleteSeasonUseCase.ExecuteAsync(id);
        }

        return NoContent();
    }
}
