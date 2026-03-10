using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class TrainingsController(
    IViewTrainingByIdUseCase viewTrainingByIdUseCase,
    IViewTrainingsUseCase viewTrainingsUseCase,
    IViewTrainingsAllUseCase viewTrainingsAllUseCase,
    IAddTrainingUseCase addTrainingUseCase,
    IEditTrainingUseCase editTrainingUseCase,
    IDeleteTrainingUseCase deleteTrainingUseCase,
    ICreatePdfUseCase<TrainingDto> createPdfUseCase,
    IValidateTrainingUseCase validateTrainingUseCase,
    IValidateAllTrainingsUseCase validateAllTrainingsUseCase)
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

    [HttpPost]
    public async Task<ActionResult<TrainingDto>> Create([FromBody] TrainingDto dto)
    {
        await addTrainingUseCase.ExecuteAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TrainingDto dto)
    {
        dto.Id = id;
        await editTrainingUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await deleteTrainingUseCase.ExecuteAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/validate")]
    public async Task<IActionResult> Validate(int id, [FromQuery] int? minPartsDurationPercent = null)
    {
        var dto = await validateTrainingUseCase.ExecuteAsync(id, minPartsDurationPercent);
        return Ok(new { isDraft = dto.IsDraft, errors = dto.ValidationErrors });
    }

    [HttpPost("validate-all")]
    public async Task<IActionResult> ValidateAll()
    {
        var (total, validCount, draftCount) = await validateAllTrainingsUseCase.ExecuteAsync();
        return Ok(new { total, validCount, draftCount });
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(int id)
    {
        var bytes = await createPdfUseCase.ExecuteAsync(id, Request.Host.Value!);
        if (bytes == null) return NotFound();
        return File(bytes, "application/pdf", $"trening-{id}.pdf");
    }
}