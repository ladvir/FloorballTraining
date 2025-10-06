using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class ActivitiesController(
    IViewActivityByIdUseCase viewActivityByIdUseCase,
    IViewActivitiesUseCase viewActivitiesUseCase,
    IViewActivitiesAllUseCase viewActivitiesAllUseCase,
    IDeleteActivityUseCase deleteActivityUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<Pagination<ActivityDto>>> Index([FromQuery] ActivitySpecificationParameters parameters)
    {
        var items = await viewActivitiesUseCase.ExecuteAsync(parameters);

        if (items.Data == null || !items.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<ActivityDto>>(items);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<ActivityDto>>> GetActivitiesAll()
    {
        var items = await viewActivitiesAllUseCase.ExecuteAsync();

        return !items.Any() ? NotFound(new ApiResponse(404)) : new ActionResult<IReadOnlyList<ActivityDto>>(items);
    }

    [HttpGet("{id}")]
    public async Task<ActivityDto?> Get(int id)
    {
        return await viewActivityByIdUseCase.ExecuteAsync(id);
    }

    [HttpDelete("delete/{id}")]
    public async Task Delete(int id)
    {
        await deleteActivityUseCase.ExecuteAsync(id);
    }
}