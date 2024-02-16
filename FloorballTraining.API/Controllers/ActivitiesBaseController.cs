using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class ActivitiesBaseController : BaseApiController
{
    private readonly IViewActivityBaseByIdUseCase _viewActivityBaseByIdUseCase;
    private readonly IViewActivitiesBaseUseCase _viewActivitiesBaseUseCase;

    public ActivitiesBaseController(

        IViewActivityBaseByIdUseCase viewActivityBaseByIdUseCase,
        IViewActivitiesBaseUseCase viewActivitiesBaseUseCase)
    {

        _viewActivityBaseByIdUseCase = viewActivityBaseByIdUseCase;
        _viewActivitiesBaseUseCase = viewActivitiesBaseUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<Pagination<ActivityBaseDto>>> Index(

        [FromQuery] ActivitySpecificationParameters parameters)
    {
        var items = await _viewActivitiesBaseUseCase.ExecuteAsync(parameters);

        if (items.Data != null && !items.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<ActivityBaseDto>>(items);
    }

    [HttpGet("{id}")]
    public async Task<ActivityBaseDto?> Get(int id)
    {
        return await _viewActivityBaseByIdUseCase.ExecuteAsync(id);
    }
}