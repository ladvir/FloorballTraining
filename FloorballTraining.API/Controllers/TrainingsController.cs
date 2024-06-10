using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class TrainingsController(
    IViewTrainingByIdUseCase viewTrainingByIdUseCase,
    IViewTrainingsUseCase viewTrainingsUseCase,
    IViewTrainingsAllUseCase viewTrainingsAllUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<Pagination<TrainingDto>>> Index(

        [FromQuery] TrainingSpecificationParameters parameters)
    {
        var items = await viewTrainingsUseCase.ExecuteAsync(parameters);

        //if (!items.Data.Any())
        //{
        //    return NotFound(new ApiResponse(404));
        //}

        return new ActionResult<Pagination<TrainingDto>>(items);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<TrainingDto>>> GetTrainingsAll()
    {
        var items = await viewTrainingsAllUseCase.ExecuteAsync();

        if (!items.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<IReadOnlyList<TrainingDto>>(items!);
    }

    [HttpGet("{id}")]
    public async Task<TrainingDto?> Get(int id)
    {
        return await viewTrainingByIdUseCase.ExecuteAsync(id);
    }
}