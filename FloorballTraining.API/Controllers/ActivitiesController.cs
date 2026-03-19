using System.Security.Claims;
using FloorballTraining.API.Errors;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Converters;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Activities;
using FloorballTraining.UseCases.Activities.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

[Authorize]
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
    IActivityRepository activityRepository,
    UserManager<AppUser> userManager)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task PopulateUserNames(IEnumerable<ActivityDto> dtos)
    {
        var userIds = dtos.Select(d => d.CreatedByUserId).Where(id => id != null).Distinct().ToList();
        var nameMap = new Dictionary<string, string>();
        foreach (var uid in userIds)
        {
            var u = await userManager.FindByIdAsync(uid!);
            if (u != null) nameMap[uid!] = $"{u.FirstName} {u.LastName}".Trim();
        }
        foreach (var dto in dtos)
        {
            if (dto.CreatedByUserId != null && nameMap.TryGetValue(dto.CreatedByUserId, out var name))
                dto.CreatedByUserName = name;
        }
    }
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

        if (!items.Any()) return NotFound(new ApiResponse(404));

        await PopulateUserNames(items);
        return new ActionResult<IReadOnlyList<ActivityDto>>(items);
    }

    [HttpGet("{id}")]
    public async Task<ActivityDto?> Get(int id)
    {
        var dto = await viewActivityByIdUseCase.ExecuteAsync(id);
        if (dto != null) await PopulateUserNames(new[] { dto });
        return dto;
    }

    [HttpPost]
    public async Task<ActionResult<ActivityDto>> Create([FromBody] ActivityDto dto)
    {
        dto.CreatedByUserId = GetCurrentUserId();
        await addActivityUseCase.ExecuteAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ActivityDto dto)
    {
        var existing = await viewActivityByIdUseCase.ExecuteAsync(id);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId();
        if (!User.IsInRole("Admin") && existing.CreatedByUserId != userId)
            return Forbid();

        dto.Id = id;
        await editActivityUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await viewActivityByIdUseCase.ExecuteAsync(id);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId();
        if (!User.IsInRole("Admin") && existing.CreatedByUserId != userId)
            return Forbid();

        await deleteActivityUseCase.ExecuteAsync(id);
        return NoContent();
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
        var bytes = await createPdfUseCase.ExecuteAsync(id, Request.Host.Value!);
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
            Preview = dto.Preview,
            IsThumbnail = dto.IsThumbnail,
        };
        var saved = await activityRepository.AddImageAsync(id, media);
        return Ok(saved.ToDto());
    }

    [HttpPut("{id}/images/{imageId}")]
    public async Task<ActionResult<ActivityMediaDto>> UpdateImage(int id, int imageId, [FromBody] ActivityMediaDto dto)
    {
        var media = new ActivityMedia
        {
            Name = dto.Name,
            Data = dto.Data,
            Preview = dto.Preview,
        };
        var updated = await activityRepository.UpdateImageAsync(id, imageId, media);
        if (updated == null) return NotFound();
        return Ok(updated.ToDto());
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
