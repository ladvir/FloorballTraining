using FloorballTraining.API.Caching;
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
    IDeletePlaceUseCase deletePlaceUseCase,
    IReferenceCache referenceCache)
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
        var places = await referenceCache.GetOrCreateAsync(
            ReferenceCacheKeys.PlacesAll, () => viewPlacesAllUseCase.ExecuteAsync());

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
    public async Task<ActionResult> Add([FromBody] PlaceDto dto)
    {
        await addPlaceUseCase.ExecuteAsync(dto);
        referenceCache.Evict(ReferenceCacheKeys.PlacesAll);
        return Ok(dto);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{placeId}")]
    public async Task<ActionResult> Edit(int placeId, [FromBody] PlaceDto dto)
    {
        dto.Id = placeId;
        await editPlaceUseCase.ExecuteAsync(dto);
        referenceCache.Evict(ReferenceCacheKeys.PlacesAll);
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

        // PlaceId is a shadow FK on Training — access via EF.Property so the query is
        // cross-database compatible (avoids T-SQL bracket quoting that breaks SQLite tests).
        var usedByTrainings = await context.Trainings
            .Where(t => EF.Property<int?>(t, "PlaceId") != null)
            .Select(t => EF.Property<int?>(t, "PlaceId")!.Value)
            .Distinct()
            .ToListAsync();

        var allUsed = usedPlaceIds.Union(usedByTrainings).ToHashSet();

        var unused = await context.Places
            .Where(p => !allUsed.Contains(p.Id))
            .ToListAsync();

        context.Places.RemoveRange(unused);
        await context.SaveChangesAsync();

        referenceCache.Evict(ReferenceCacheKeys.PlacesAll);
        return Ok(new { deleted = unused.Count });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{placeId:int}")]
    public async Task<ActionResult> Delete(int placeId)
    {
        await deletePlaceUseCase.ExecuteAsync(new PlaceDto { Id = placeId });
        referenceCache.Evict(ReferenceCacheKeys.PlacesAll);
        return NoContent();
    }
}