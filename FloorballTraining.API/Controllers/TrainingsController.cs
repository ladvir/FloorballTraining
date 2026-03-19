using System.Security.Claims;
using FloorballTraining.API.Errors;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.UseCases.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class TrainingsController(
    IViewTrainingByIdUseCase viewTrainingByIdUseCase,
    IViewTrainingsUseCase viewTrainingsUseCase,
    IViewTrainingsAllUseCase viewTrainingsAllUseCase,
    IAddTrainingUseCase addTrainingUseCase,
    IEditTrainingUseCase editTrainingUseCase,
    IDeleteTrainingUseCase deleteTrainingUseCase,
    ICreatePdfUseCase<TrainingDto> createPdfUseCase,
    IValidateTrainingUseCase validateTrainingUseCase,
    IValidateAllTrainingsUseCase validateAllTrainingsUseCase,
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task PopulateUserNames(IEnumerable<TrainingDto> dtos)
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

        await PopulateUserNames(items);
        return new ActionResult<IReadOnlyList<TrainingDto>>(items!);
    }

    [HttpGet("{id}")]
    public async Task<TrainingDto?> Get(int id)
    {
        var dto = await viewTrainingByIdUseCase.ExecuteAsync(id);
        if (dto != null) await PopulateUserNames(new[] { dto });
        return dto;
    }

    [HttpPost]
    public async Task<ActionResult<TrainingDto>> Create([FromBody] TrainingDto dto)
    {
        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole == "User") return Forbid();

        dto.CreatedByUserId = userId;
        await addTrainingUseCase.ExecuteAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TrainingDto dto)
    {
        var existing = await viewTrainingByIdUseCase.ExecuteAsync(id);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole == "User") return Forbid();

        dto.Id = id;
        await editTrainingUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await viewTrainingByIdUseCase.ExecuteAsync(id);
        if (existing == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);
        if (roleInfo.EffectiveRole == "User") return Forbid();

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