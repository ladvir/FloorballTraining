using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Places;
using FloorballTraining.UseCases.Places.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class PlacesController : BaseApiController
{

    private readonly IViewPlaceByIdUseCase _viewPlaceByIdUseCase;
    private readonly IViewPlacesUseCase _viewPlacesUseCase;

    public PlacesController(

        IViewPlaceByIdUseCase viewTagByIdUseCase,
        IViewPlacesUseCase viewTagsUseCase)
    {

        _viewPlaceByIdUseCase = viewTagByIdUseCase;
        _viewPlacesUseCase = viewTagsUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<Pagination<PlaceDto>>> Index(

        [FromQuery] PlaceSpecificationParameters parameters)
    {
        var places = await _viewPlacesUseCase.ExecuteAsync(parameters);

        if (!places.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<PlaceDto>>(places);
    }

    [HttpGet("{placeId}")]
    public async Task<PlaceDto?> Get(int placeId)
    {
        return await _viewPlaceByIdUseCase.ExecuteAsync(placeId);
    }
}

