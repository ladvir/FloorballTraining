using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class TrainingsController : BaseApiController
{
    private readonly IViewTrainingByIdUseCase _viewTrainingByIdUseCase;
    private readonly IViewTrainingsUseCase _viewTrainingsUseCase;
    private readonly IViewTrainingsAllUseCase _viewTrainingsAllUseCase;

    public TrainingsController(

        IViewTrainingByIdUseCase viewTrainingByIdUseCase,
        IViewTrainingsUseCase viewTrainingsUseCase,
        IViewTrainingsAllUseCase viewTrainingsAllUseCase)
    {

        _viewTrainingByIdUseCase = viewTrainingByIdUseCase;
        _viewTrainingsUseCase = viewTrainingsUseCase;
        _viewTrainingsAllUseCase = viewTrainingsAllUseCase;
    }

    [HttpGet]
    public async Task<ActionResult<Pagination<TrainingDto>>> Index(

        [FromQuery] TrainingSpecificationParameters parameters)
    {
        var items = await _viewTrainingsUseCase.ExecuteAsync(parameters);

        //if (!items.Data.Any())
        //{
        //    return NotFound(new ApiResponse(404));
        //}

        return new ActionResult<Pagination<TrainingDto>>(items);
    }

    [HttpGet("all")]
    public async Task<ActionResult<IReadOnlyList<TrainingDto>>> GetTrainingsAll()
    {
        var items = await _viewTrainingsAllUseCase.ExecuteAsync();

        if (!items.Any())
        {
            return NotFound(new ApiResponse(404));
        }

        return new ActionResult<IReadOnlyList<TrainingDto>>(items!);
    }

    [HttpGet("{id}")]
    public async Task<TrainingDto?> Get(int id)
    {
        return await _viewTrainingByIdUseCase.ExecuteAsync(id);
    }
}