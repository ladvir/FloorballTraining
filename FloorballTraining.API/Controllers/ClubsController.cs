using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Clubs.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class ClubsController(
    IViewClubsAllUseCase viewClubsAllUseCase,
    IViewClubsUseCase viewClubsUseCase,
    IViewClubByIdUseCase viewClubByIdUseCase,
    IAddClubUseCase addClubUseCase,
    IEditClubUseCase editClubUseCase,
    IDeleteClubUseCase deleteClubUseCase)
    : BaseApiController
{
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

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewClubByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] ClubDto dto)
    {
        await addClubUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] ClubDto dto)
    {
        await editClubUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] int clubId)
    {
        await deleteClubUseCase.ExecuteAsync(clubId);
        return NoContent();
    }
}
