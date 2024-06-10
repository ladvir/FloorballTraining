using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.AgeGroups;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Places;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class AgeGroupsController(
    IViewAgeGroupByIdUseCase viewAgeGroupByIdUseCase,
    IViewAgeGroupsUseCase viewAgeGroupsUseCase,
    IViewAgeGroupsAllUseCase viewAgeGroupsAllUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<Pagination<AgeGroupDto>>> Index(

        [FromQuery] AgeGroupSpecificationParameters parameters)
    {
        var items = await viewAgeGroupsUseCase.ExecuteAsync(parameters);

        if (items.Data != null && !items.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<AgeGroupDto>>(items);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<AgeGroupDto>>> GetAllAgeGroups()
    {
        var items = await viewAgeGroupsAllUseCase.ExecuteAsync();

        if (!items.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<IReadOnlyList<AgeGroupDto>>(items);
    }

    [HttpGet("{id}")]
    public async Task<AgeGroupDto?> Get(int id)
    {
        return await viewAgeGroupByIdUseCase.ExecuteAsync(id);
    }
}