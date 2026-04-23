using System.Security.Claims;
using FloorballTraining.API.Errors;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Specifications;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using FloorballTraining.UseCases;
using FloorballTraining.UseCases.Trainings;
using FloorballTraining.UseCases.Trainings.Interfaces;
using FloorballTraining.UseCases.Helpers;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    IClubRoleService clubRoleService,
    ITrainingSimilarityService similarityService,
    FloorballTrainingContext context)
    : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsAdmin() => User.IsInRole("Admin");

    private async Task<List<string>> GetClubMemberUserIdsAsync(string userId)
    {
        var myClubIds = await context.Members
            .Where(m => m.AppUserId == userId && m.ClubId > 0)
            .Select(m => m.ClubId)
            .Distinct()
            .ToListAsync();

        if (myClubIds.Count == 0) return [];

        return await context.Members
            .Where(m => myClubIds.Contains(m.ClubId) && m.AppUserId != null)
            .Select(m => m.AppUserId!)
            .Distinct()
            .ToListAsync();
    }

    /// <summary>
    /// Builds the user scope for similarity lookups.
    /// - Admin → null (search all trainings).
    /// - Otherwise → {current user} ∪ {current user's club members} ∪ (if different) {training author} ∪ {author's club members}.
    /// Extending with the author's scope lets a coach/head coach/club admin see similar trainings
    /// even when editing someone else's training from a different club.
    /// </summary>
    private async Task<IReadOnlyCollection<string>?> BuildSimilarityScopeAsync(string userId, string? draftAuthorUserId)
    {
        if (IsAdmin()) return null;

        var ids = new HashSet<string>(StringComparer.Ordinal) { userId };
        foreach (var m in await GetClubMemberUserIdsAsync(userId)) ids.Add(m);

        if (!string.IsNullOrEmpty(draftAuthorUserId) && draftAuthorUserId != userId)
        {
            ids.Add(draftAuthorUserId);
            foreach (var m in await GetClubMemberUserIdsAsync(draftAuthorUserId)) ids.Add(m);
        }

        return ids;
    }

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

        var appointmentCount = await context.Appointments.CountAsync(a => a.TrainingId == id);
        if (appointmentCount > 0)
        {
            return Conflict(new ApiResponse(
                409,
                $"Trénink je naplánován v {appointmentCount} {(appointmentCount == 1 ? "události" : "událostech")} a nelze jej smazat. Nejprve odstraňte nebo přeplánujte tyto události, nebo vyberte jiný trénink."
            ));
        }

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

    [HttpPost("similarity-check")]
    public async Task<ActionResult<List<SimilarTrainingDto>>> SimilarityCheck([FromBody] TrainingDto draft)
    {
        var userId = GetCurrentUserId()!;

        // The draft posted from the form doesn't include CreatedByUserId. If this is an
        // existing training (Id > 0), look up its author so the scope extends to the author's club
        // when the current user (coach/club admin/head coach) is editing someone else's training.
        var authorUserId = draft.CreatedByUserId;
        if (string.IsNullOrEmpty(authorUserId) && draft.Id > 0)
        {
            authorUserId = await context.Trainings
                .Where(t => t.Id == draft.Id)
                .Select(t => t.CreatedByUserId)
                .FirstOrDefaultAsync();
        }

        var scope = await BuildSimilarityScopeAsync(userId, authorUserId);
        var results = await similarityService.FindSimilarForAsync(draft, userId, scope);
        await PopulateSimilarUserNames(results);
        return Ok(results);
    }

    [HttpGet("{id}/similar")]
    public async Task<ActionResult<List<SimilarTrainingDto>>> GetSimilar(int id)
    {
        var dto = await viewTrainingByIdUseCase.ExecuteAsync(id);
        if (dto == null) return NotFound();

        var userId = GetCurrentUserId()!;
        var scope = await BuildSimilarityScopeAsync(userId, dto.CreatedByUserId);
        var results = await similarityService.FindSimilarForAsync(dto, userId, scope);
        await PopulateSimilarUserNames(results);
        return Ok(results);
    }

    [HttpGet("duplicates")]
    public async Task<ActionResult<List<DuplicateGroupDto>>> GetDuplicates([FromQuery] string tier = "A")
    {
        var userId = GetCurrentUserId()!;
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(userId);

        List<string>? scope;
        if (IsAdmin())
        {
            scope = null; // all trainings
        }
        else if (roleInfo.EffectiveRole == "ClubAdmin" && roleInfo.ClubId.HasValue)
        {
            scope = await context.Members
                .Where(m => m.ClubId == roleInfo.ClubId && m.AppUserId != null)
                .Select(m => m.AppUserId!)
                .Distinct()
                .ToListAsync();
        }
        else
        {
            return Forbid();
        }

        var parsedTier = string.Equals(tier, "B", StringComparison.OrdinalIgnoreCase) ? SimilarityTier.B : SimilarityTier.A;
        var groups = await similarityService.FindDuplicateGroupsAsync(parsedTier, scope);
        await PopulateGroupUserNames(groups);
        return Ok(groups);
    }

    private async Task PopulateSimilarUserNames(IEnumerable<SimilarTrainingDto> dtos)
    {
        var ids = dtos.Where(d => d.CreatedByUserId != null).Select(d => d.CreatedByUserId!).Distinct().ToList();
        var nameMap = new Dictionary<string, string>();
        foreach (var uid in ids)
        {
            var u = await userManager.FindByIdAsync(uid);
            if (u != null) nameMap[uid] = $"{u.FirstName} {u.LastName}".Trim();
        }
        foreach (var d in dtos)
        {
            if (d.CreatedByUserId != null && nameMap.TryGetValue(d.CreatedByUserId, out var name))
                d.CreatedByUserName = name;
        }
    }

    private async Task PopulateGroupUserNames(IEnumerable<DuplicateGroupDto> groups)
    {
        var all = groups.SelectMany(g => g.Trainings).ToList();
        await PopulateSimilarUserNames(all);
    }

    [HttpGet("appointment-counts")]
    public async Task<ActionResult<Dictionary<int, int>>> GetAppointmentCounts([FromQuery] int[] ids)
    {
        if (ids == null || ids.Length == 0) return Ok(new Dictionary<int, int>());
        var counts = await context.Appointments
            .Where(a => a.TrainingId != null && ids.Contains(a.TrainingId.Value))
            .GroupBy(a => a.TrainingId!.Value)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToListAsync();
        var result = ids.ToDictionary(id => id, id => counts.FirstOrDefault(c => c.Id == id)?.Count ?? 0);
        return Ok(result);
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(
        int id,
        [FromQuery] bool includeTrainingParameters = true,
        [FromQuery] bool includeTrainingDetails = true,
        [FromQuery] bool includeTrainingDescription = true,
        [FromQuery] bool includeComments = true,
        [FromQuery] bool includePartDescriptions = true,
        [FromQuery] bool includeActivityDescriptions = true,
        [FromQuery] bool includeImages = true)
    {
        var options = new Reporting.PdfOptions
        {
            IncludeTrainingParameters = includeTrainingParameters,
            IncludeTrainingDetails = includeTrainingDetails,
            IncludeTrainingDescription = includeTrainingDescription,
            IncludeComments = includeComments,
            IncludePartDescriptions = includePartDescriptions,
            IncludeActivityDescriptions = includeActivityDescriptions,
            IncludeImages = includeImages
        };
        var bytes = await createPdfUseCase.ExecuteAsync(id, Request.Host.Value!, options);
        if (bytes == null) return NotFound();
        return File(bytes, "application/pdf", $"trening-{id}.pdf");
    }
}