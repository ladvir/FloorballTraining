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
    private readonly IViewActivitiesAllUseCase _viewActivitiesAllUseCase;

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

        //if (!items.Data.Any())
        //{
        //    return NotFound(new ApiResponse(404));
        //}

        return new ActionResult<Pagination<ActivityDto>>(items);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<ActivityDto>>> GetActivitiesAll()
    {
        var items = await _viewActivitiesAllUseCase.ExecuteAsync();

        if (!items.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<IReadOnlyList<ActivityDto>>(items);
    }





    [HttpGet("{id}")]
    public async Task<ActivityDto?> Get(int id)
    {
        return await _viewActivityByIdUseCase.ExecuteAsync(id);
    }
}