using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Teams.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class TeamsController(
    IViewTeamsAllUseCase viewTeamsAllUseCase,
    IViewTeamByIdUseCase viewTeamByIdUseCase,
    IAddTeamUseCase addTeamUseCase,
    IEditTeamUseCase editTeamUseCase,
    IDeleteTeamUseCase deleteTeamUseCase,
    IClubRoleService clubRoleService)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await viewTeamsAllUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewTeamByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] TeamDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        await addTeamUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] TeamDto dto)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        await editTeamUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int teamId)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        await deleteTeamUseCase.ExecuteAsync(teamId);
        return NoContent();
    }

    [HttpPost("{id}/import-ical")]
    public async Task<IActionResult> ImportICal(int id, [FromServices] IICalImportService iCalImportService)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.EffectiveRole is not ("HeadCoach" or "Admin")) return Forbid();

        var result = await iCalImportService.ImportAsync(id, GetCurrentUserId()!);

        if (result.Errors.Count > 0 && result.Imported == 0 && result.Updated == 0)
            return BadRequest(new { message = string.Join("; ", result.Errors) });

        return Ok(result);
    }
}
