using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Places;
using FloorballTraining.UseCases.Places.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

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

    [HttpPost]
    public async Task<ActionResult> Add([FromBody] PlaceDto dto)
    {
        await addPlaceUseCase.ExecuteAsync(dto);
        return Ok(dto);
    }

    [HttpPut("{placeId}")]
    public async Task<ActionResult> Edit(int placeId, [FromBody] PlaceDto dto)
    {
        dto.Id = placeId;
        await editPlaceUseCase.ExecuteAsync(dto);
        return Ok();
    }

    [HttpDelete("{placeId}")]
    public async Task<ActionResult> Delete(int placeId)
    {
        await deletePlaceUseCase.ExecuteAsync(new PlaceDto { Id = placeId });
        return NoContent();
    }
}