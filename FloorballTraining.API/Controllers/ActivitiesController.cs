using System.Security.Claims;
using FloorballTraining.API.Errors;
using FloorballTraining.API.Helpers;
using FloorballTraining.API.Services;
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
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService,
    IAuditService auditService,
    FloorballTrainingContext context)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task PopulateUserNames(IEnumerable<ActivityDto> dtos)
    {
        var userIds = dtos.Select(d => d.CreatedByUserId).Where(id => id != null).Cast<string>().Distinct().ToList();
        var nameMap = await UserNameHelper.GetNameMapAsync(userManager, userIds);
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
        await auditService.LogAsync(AuditActions.ActivityCreated, "Activity", dto.Id.ToString(),
            details: new { name = dto.Name });
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ActivityDto dto)
    {
        var existing = await viewActivityByIdUseCase.ExecuteAsync(id);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole == "User") return Forbid();

        var canEditAny = User.IsInRole("Admin") ||
                         roleInfo.EffectiveRole is "HeadCoach" or "ClubAdmin";
        // Coaches may only edit their own activities; null-author means pre-auth, treat as unclaimed.
        if (!canEditAny && existing.CreatedByUserId != null && existing.CreatedByUserId != userId)
            return Forbid();

        // Club-scope guard: HeadCoach/ClubAdmin may only edit activities authored by members of
        // their own club. Null-author (seed/shared) activities and missing ClubId → Admin only.
        if (canEditAny && !User.IsInRole("Admin"))
        {
            if (!roleInfo.ClubId.HasValue || existing.CreatedByUserId == null)
                return Forbid();
            var authorInSameClub = await context.Members
                .AnyAsync(m => m.AppUserId == existing.CreatedByUserId && m.ClubId == roleInfo.ClubId.Value);
            if (!authorInSameClub)
                return Forbid();
        }

        dto.Id = id;
        await editActivityUseCase.ExecuteAsync(dto);
        await auditService.LogAsync(AuditActions.ActivityUpdated, "Activity", id.ToString(),
            details: new { name = dto.Name });
        return NoContent();
    }

    [HttpGet("{id}/usage")]
    public async Task<ActionResult<ActivityUsageDto>> GetUsage(int id)
    {
        var existing = await viewActivityByIdUseCase.ExecuteAsync(id);
        if (existing == null) return NotFound();

        var trainingIds = await context.TrainingGroups
            .Where(g => g.ActivityId == id)
            .Select(g => g.TrainingPart.TrainingId)
            .Distinct()
            .ToListAsync();

        var trainings = await context.Trainings
            .Where(t => trainingIds.Contains(t.Id))
            .Select(t => new ActivityUsageTrainingDto { TrainingId = t.Id, TrainingName = t.Name ?? string.Empty })
            .ToListAsync();

        return Ok(new ActivityUsageDto
        {
            TrainingCount = trainings.Count,
            Trainings = trainings
                .OrderBy(t => t.TrainingName, StringComparer.Create(System.Globalization.CultureInfo.GetCultureInfo("cs-CZ"), false))
                .ToList()
        });
    }

    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await viewActivityByIdUseCase.ExecuteAsync(id);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole == "User") return Forbid();

        var canDeleteAny = User.IsInRole("Admin") ||
                           roleInfo.EffectiveRole is "HeadCoach" or "ClubAdmin";
        // Coaches may only delete their own activities; null-author = pre-auth, treat as unclaimed.
        if (!canDeleteAny && existing.CreatedByUserId != null && existing.CreatedByUserId != userId)
            return Forbid();

        // Club-scope guard: HeadCoach/ClubAdmin may only delete activities authored by members of
        // their own club. Null-author (seed/shared) activities and missing ClubId → Admin only.
        if (canDeleteAny && !User.IsInRole("Admin"))
        {
            if (!roleInfo.ClubId.HasValue || existing.CreatedByUserId == null)
                return Forbid();
            var authorInSameClub = await context.Members
                .AnyAsync(m => m.AppUserId == existing.CreatedByUserId && m.ClubId == roleInfo.ClubId.Value);
            if (!authorInSameClub)
                return Forbid();
        }

        var trainingCount = await context.TrainingGroups
            .Where(g => g.ActivityId == id)
            .Select(g => g.TrainingPart.TrainingId)
            .Distinct()
            .CountAsync();

        if (trainingCount > 0)
        {
            return Conflict(new ApiResponse(
                409,
                $"Aktivita je použita v {trainingCount} {(trainingCount == 1 ? "tréninku" : trainingCount < 5 ? "trénincích" : "trénincích")} a nelze ji smazat. Nejprve ji odeberte z těchto tréninků."
            ));
        }

        await deleteActivityUseCase.ExecuteAsync(id);
        await auditService.LogAsync(AuditActions.ActivityDeleted, "Activity", id.ToString(),
            details: new { name = existing.Name });
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
    public async Task<IActionResult> GetPdf(int id, [FromQuery] bool includeActivityDescriptions = true, [FromQuery] bool includeImages = true)
    {
        var options = new Reporting.PdfOptions
        {
            IncludeActivityDescriptions = includeActivityDescriptions,
            IncludeImages = includeImages
        };
        var bytes = await createPdfUseCase.ExecuteAsync(id, Request.Host.Value!, options);
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
