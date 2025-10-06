using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Teams.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class TeamsController(
    IViewTeamsAllUseCase viewTeamsAllUseCase,
    IViewTeamByIdUseCase viewTeamByIdUseCase,
    IAddTeamUseCase addTeamUseCase,
    IEditTeamUseCase editTeamUseCase,
    IDeleteTeamUseCase deleteTeamUseCase)
    : BaseApiController
{
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
        await addTeamUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] TeamDto dto)
    {
        await editTeamUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int teamId)
    {
        await deleteTeamUseCase.ExecuteAsync(teamId);
        return NoContent();
    }
}
