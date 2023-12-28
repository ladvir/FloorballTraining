using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class ActivitiesController : BaseApiController
{
    private readonly IViewActivityByIdUseCase _viewActivityByIdUseCase;
    private readonly IViewActivitiesUseCase _viewActivitiesUseCase;

    public ActivitiesController(

        IViewActivityByIdUseCase viewActivityByIdUseCase,
        IViewActivitiesUseCase viewActivitiesUseCase)
    {

        _viewActivityByIdUseCase = viewActivityByIdUseCase;
        _viewActivitiesUseCase = viewActivitiesUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<Pagination<ActivityDto>>> Index(

        [FromQuery] ActivitySpecificationParameters parameters)
    {
        var items = await _viewActivitiesUseCase.ExecuteAsync(parameters);

        if (!items.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<ActivityDto>>(items);
    }

    [HttpGet("{id}")]
    public async Task<ActivityDto?> Get(int id)
    {
        return await _viewActivityByIdUseCase.ExecuteAsync(id);
    }
}