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

    public AgeGroupsController(

        IViewAgeGroupByIdUseCase viewAgeGroupByIdUseCase,
        IViewAgeGroupsUseCase viewAgeGroupsUseCase)
    {

        _viewAgeGroupByIdUseCase = viewAgeGroupByIdUseCase;
        _viewAgeGroupsUseCase = viewAgeGroupsUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<Pagination<AgeGroupDto>>> Index(

        [FromQuery] AgeGroupSpecificationParameters parameters)
    {
        var items = await _viewAgeGroupsUseCase.ExecuteAsync(parameters);

        if (!items.Data.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<Pagination<AgeGroupDto>>(items);
    }

    [HttpGet("{id}")]
    public async Task<AgeGroupDto?> Get(int id)
    {
        return await _viewAgeGroupByIdUseCase.ExecuteAsync(id);
    }
}