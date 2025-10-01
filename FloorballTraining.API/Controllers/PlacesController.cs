using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Places;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class PlacesController(
    IViewPlaceByIdUseCase viewTagByIdUseCase,
    IViewPlacesUseCase viewTagsUseCase,
    IViewPlacesAllUseCase viewPlacesAllUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<Pagination<PlaceDto>>> Index(

        [FromQuery] PlaceSpecificationParameters parameters)
    {
        var places = await viewTagsUseCase.ExecuteAsync(parameters);

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
        return await viewTagByIdUseCase.ExecuteAsync(placeId);
    }
}