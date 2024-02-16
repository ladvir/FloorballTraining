using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.AgeGroups;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.Places;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class AgeGroupsController : BaseApiController
{

    private readonly IViewAgeGroupByIdUseCase _viewAgeGroupByIdUseCase;
    private readonly IViewAgeGroupsUseCase _viewAgeGroupsUseCase;
    private readonly IViewAgeGroupsAllUseCase _viewAgeGroupsAllUseCase;

    public AgeGroupsController(

        IViewAgeGroupByIdUseCase viewAgeGroupByIdUseCase,
        IViewAgeGroupsUseCase viewAgeGroupsUseCase,
        IViewAgeGroupsAllUseCase viewAgeGroupsAllUseCase)
    {

        _viewAgeGroupByIdUseCase = viewAgeGroupByIdUseCase;
        _viewAgeGroupsUseCase = viewAgeGroupsUseCase;
        _viewAgeGroupsAllUseCase = viewAgeGroupsAllUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<Pagination<AgeGroupDto>>> Index(

        [FromQuery] AgeGroupSpecificationParameters parameters)
    {
        var items = await _viewAgeGroupsUseCase.ExecuteAsync(parameters);

        if (items.Data != null && !items.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<AgeGroupDto>>(items);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<AgeGroupDto>>> GetAllAgeGroups()
    {
        var items = await _viewAgeGroupsAllUseCase.ExecuteAsync();

        if (!items.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<IReadOnlyList<AgeGroupDto>>(items);
    }

    [HttpGet("{id}")]
    public async Task<AgeGroupDto?> Get(int id)
    {
        return await _viewAgeGroupByIdUseCase.ExecuteAsync(id);
    }
}