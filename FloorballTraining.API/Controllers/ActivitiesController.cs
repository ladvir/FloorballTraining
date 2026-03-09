using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class ActivitiesController(
    IViewActivityByIdUseCase viewActivityByIdUseCase,
    IViewActivitiesUseCase viewActivitiesUseCase,
    IViewActivitiesAllUseCase viewActivitiesAllUseCase,
    IAddActivityUseCase addActivityUseCase,
    IEditActivityUseCase editActivityUseCase,
    IDeleteActivityUseCase deleteActivityUseCase,
    IValidateActivityUseCase validateActivityUseCase,
    IValidateAllActivitiesUseCase validateAllActivitiesUseCase,
    ICreatePdfUseCase<ActivityDto> createPdfUseCase,
    IActivityRepository activityRepository)
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

    [HttpPost]
    public async Task<ActionResult<ActivityDto>> Create([FromBody] ActivityDto dto)
    {
        await addActivityUseCase.ExecuteAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ActivityDto dto)
    {
        dto.Id = id;
        await editActivityUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete("delete/{id}")]
    public async Task Delete(int id)
    {
        await deleteActivityUseCase.ExecuteAsync(id);
    }

    [HttpPost("{id}/validate")]
    public async Task<IActionResult> Validate(int id)
    {
        var dto = await validateActivityUseCase.ExecuteAsync(id);
        return Ok(new { isDraft = dto.IsDraft, errors = dto.ValidationErrors });
    }

    [HttpPost("validate-all")]
    public async Task<IActionResult> ValidateAll()
    {
        var (total, validCount, draftCount) = await validateAllActivitiesUseCase.ExecuteAsync();
        return Ok(new { total, validCount, draftCount });
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(int id)
    {
        var bytes = await createPdfUseCase.ExecuteAsync(id, Request.Host.Value);
        if (bytes == null) return NotFound();
        return File(bytes, "application/pdf", $"aktivita-{id}.pdf");
    }

    [HttpPost("{id}/images")]
    public async Task<ActionResult<ActivityMediaDto>> AddImage(int id, [FromBody] ActivityMediaDto dto)
    {
        var media = new ActivityMedia
        {
            MediaType = MediaType.Image,
            Name = dto.Name,
            Data = dto.Data,
            IsThumbnail = dto.IsThumbnail,
        };
        var saved = await activityRepository.AddImageAsync(id, media);
        return Ok(saved.ToDto());
    }

    [HttpDelete("{id}/images/{imageId}")]
    public async Task<IActionResult> DeleteImage(int id, int imageId)
    {
        await activityRepository.DeleteImageAsync(id, imageId);
        return NoContent();
    }

    [HttpPost("{id}/images/{imageId}/thumbnail")]
    public async Task<IActionResult> SetThumbnail(int id, int imageId)
    {
        await activityRepository.SetThumbnailAsync(id, imageId);
        return NoContent();
    }
}
