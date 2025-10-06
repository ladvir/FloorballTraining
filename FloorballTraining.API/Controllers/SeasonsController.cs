using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Seasons.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

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

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] SeasonDto dto)
    {
        await addSeasonUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut("edit")]
    public async Task<IActionResult> Edit([FromBody] SeasonDto dto)
    {
        await editSeasonUseCase.ExecuteAsync(dto);
        return NoContent();
    }

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
