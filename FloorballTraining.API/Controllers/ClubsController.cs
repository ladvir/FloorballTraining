using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.UseCases.Clubs.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class ClubsController(
    IViewClubsAllUseCase viewClubsAllUseCase,
    IViewClubsUseCase viewClubsUseCase,
    IViewClubByIdUseCase viewClubByIdUseCase,
    IAddClubUseCase addClubUseCase,
    IEditClubUseCase editClubUseCase,
    IDeleteClubUseCase deleteClubUseCase,
    FloorballTrainingContext context)
    : BaseApiController
{
    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<IActionResult> GetPublicClubs()
    {
        var clubs = await context.Clubs
            .Where(c => c.MaxRegistrationRole != null)
            .Select(c => new { c.Id, c.Name, c.MaxRegistrationRole })
            .ToListAsync();
        return Ok(clubs);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await viewClubsAllUseCase.ExecuteAsync();
        return Ok(result);
    }
    
    public async Task<IActionResult> GetWithSpecification(ClubSpecificationParameters clubSpecificationParameters)
    {
        var result = await viewClubsUseCase.ExecuteAsync(clubSpecificationParameters);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewClubByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] ClubDto dto)
    {
        await addClubUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] ClubDto dto)
    {
        await editClubUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int clubId)
    {
        await deleteClubUseCase.ExecuteAsync(clubId);
        return NoContent();
    }
}
