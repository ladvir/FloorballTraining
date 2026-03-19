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
    IDeleteSeasonUseCase deleteSeasonUseCase)
    : BaseApiController
{
    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        var result = await viewSeasonsAllUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewSeasonByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] SeasonDto dto)
    {
        await addSeasonUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("edit")]
    public async Task<IActionResult> Edit([FromBody] SeasonDto dto)
    {
        await editSeasonUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("delete/{seasonId}")]
    public async Task<IActionResult> Delete(string seasonId)
    {
        if (int.TryParse(seasonId, out var result))
        {
            await deleteSeasonUseCase.ExecuteAsync(result);
        }

        return NoContent();
    }
}
