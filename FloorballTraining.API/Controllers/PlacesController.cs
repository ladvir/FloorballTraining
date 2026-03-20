using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Places;
using FloorballTraining.UseCases.Places.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class PlacesController(
    IViewPlaceByIdUseCase viewPlaceByIdUseCase,
    IViewPlacesUseCase viewPlacesUseCase,
    IViewPlacesAllUseCase viewPlacesAllUseCase,
    IAddPlaceUseCase addPlaceUseCase,
    IEditPlaceUseCase editPlaceUseCase,
    IDeletePlaceUseCase deletePlaceUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<Pagination<PlaceDto>>> Index(

        [FromQuery] PlaceSpecificationParameters parameters)
    {
        var places = await viewPlacesUseCase.ExecuteAsync(parameters);

        if (places.Data != null && !places.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<PlaceDto>>(places);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<PlaceDto>>> GetPlacesAll()
    {
        var places = await viewPlacesAllUseCase.ExecuteAsync();

        if (!places.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<IReadOnlyList<PlaceDto>>(places);
    }

    [HttpGet("{placeId}")]
    public async Task<PlaceDto?> Get(int placeId)
    {
        return await viewPlaceByIdUseCase.ExecuteAsync(placeId);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult> Add([FromBody] PlaceDto dto, [FromServices] FloorballTrainingContext context)
    {
        await addPlaceUseCase.ExecuteAsync(dto);

        // The use case doesn't return the generated ID, so find the newly created place by name
        var created = await context.Places
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync(p => p.Name == dto.Name);

        if (created != null) dto.Id = created.Id;

        return Ok(dto);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{placeId}")]
    public async Task<ActionResult> Edit(int placeId, [FromBody] PlaceDto dto)
    {
        dto.Id = placeId;
        await editPlaceUseCase.ExecuteAsync(dto);
        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("unused")]
    public async Task<ActionResult> DeleteUnused([FromServices] FloorballTrainingContext context)
    {
        var usedPlaceIds = await context.Appointments
            .Select(a => a.LocationId)
            .Distinct()
            .ToListAsync();

        // Training has a shadow FK PlaceId - query it via raw SQL
        var usedByTrainings = await context.Database
            .SqlQueryRaw<int>("SELECT DISTINCT PlaceId AS [Value] FROM Trainings WHERE PlaceId IS NOT NULL")
            .ToListAsync();

        var allUsed = usedPlaceIds.Union(usedByTrainings).ToHashSet();

        var unused = await context.Places
            .Where(p => !allUsed.Contains(p.Id))
            .ToListAsync();

        context.Places.RemoveRange(unused);
        await context.SaveChangesAsync();

        return Ok(new { deleted = unused.Count });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{placeId:int}")]
    public async Task<ActionResult> Delete(int placeId)
    {
        await deletePlaceUseCase.ExecuteAsync(new PlaceDto { Id = placeId });
        return NoContent();
    }
}