using System.Security.Claims;
using FloorballTraining.API.Helpers;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// Systémové šablony tréninků (globální, viditelné všem trenérským rolím). Vytvořit smí každá
/// trenérská role, upravit/smazat autor nebo Admin.
/// </summary>
[Authorize]
public class TrainingTemplatesController(
    FloorballTrainingContext context,
    UserManager<AppUser> userManager,
    IClubRoleService clubRoleService) : BaseApiController
{
    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task<bool> IsCoachAsync() =>
        User.IsInRole("Admin") || (await clubRoleService.GetUserClubRoleAsync(CurrentUserId!)).EffectiveRole != "User";

    private bool CanModify(TrainingTemplate t) =>
        User.IsInRole("Admin") || t.CreatedByUserId == null || t.CreatedByUserId == CurrentUserId;

    private IQueryable<TrainingTemplate> Query() => context.TrainingTemplates
        .Include(t => t.Parts.OrderBy(p => p.Order)).ThenInclude(p => p.Activities)
        .AsSplitQuery();

    private async Task<List<TrainingTemplateDto>> ToDtosAsync(IReadOnlyCollection<TrainingTemplate> templates)
    {
        var ids = templates.Select(t => t.CreatedByUserId).Where(i => i != null).Cast<string>().Distinct().ToList();
        var names = await UserNameHelper.GetNameMapAsync(userManager, ids);
        return templates.Select(t => new TrainingTemplateDto
        {
            Id = t.Id,
            RowVersion = t.RowVersion,
            Name = t.Name,
            Description = t.Description,
            CreatedByUserId = t.CreatedByUserId,
            CreatedByUserName = t.CreatedByUserId != null && names.TryGetValue(t.CreatedByUserId, out var n) ? n : null,
            CreatedAt = t.CreatedAt,
            TotalDuration = t.Parts.Sum(p => p.Duration),
            CanEdit = CanModify(t),
            Parts = t.Parts.OrderBy(p => p.Order).Select(p => new TrainingTemplatePartDto
            {
                Name = p.Name,
                Description = p.Description,
                Duration = p.Duration,
                Order = p.Order,
                ActivityIds = p.Activities.OrderBy(a => a.Id).Select(a => a.ActivityId).ToList(),
            }).ToList(),
        }).ToList();
    }

    /// <summary>Jen existující aktivity (klient mohl mezitím jednu smazat).</summary>
    private async Task<List<TrainingTemplatePart>> BuildPartsAsync(TrainingTemplateDto dto)
    {
        var wanted = dto.Parts.SelectMany(p => p.ActivityIds).Distinct().ToList();
        var existing = (await context.Activities.Where(a => wanted.Contains(a.Id)).Select(a => a.Id).ToListAsync()).ToHashSet();
        return dto.Parts.OrderBy(p => p.Order).Select((p, i) => new TrainingTemplatePart
        {
            Name = p.Name,
            Description = p.Description,
            Duration = p.Duration,
            Order = i + 1,
            Activities = p.ActivityIds.Where(existing.Contains)
                .Select(id => new TrainingTemplatePartActivity { ActivityId = id }).ToList(),
        }).ToList();
    }

    private static string? Validate(TrainingTemplateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return "Název šablony je povinný.";
        if (dto.Parts.Count == 0) return "Šablona musí mít alespoň jednu část.";
        if (dto.Parts.Any(p => p.Duration < 0)) return "Délka části nesmí být záporná.";
        return null;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!await IsCoachAsync()) return Forbid();
        var templates = await Query().OrderBy(t => t.Name).ToListAsync();
        return Ok(await ToDtosAsync(templates));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        if (!await IsCoachAsync()) return Forbid();
        var t = await Query().FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        return Ok((await ToDtosAsync([t]))[0]);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TrainingTemplateDto dto)
    {
        if (!await IsCoachAsync()) return Forbid();
        if (Validate(dto) is { } error) return BadRequest(new { message = error });

        var t = new TrainingTemplate
        {
            Name = dto.Name.Trim(),
            Description = dto.Description,
            CreatedByUserId = CurrentUserId,
            Parts = await BuildPartsAsync(dto),
        };
        context.TrainingTemplates.Add(t);
        await context.SaveChangesAsync();
        return Ok((await ToDtosAsync([t]))[0]);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TrainingTemplateDto dto)
    {
        if (!await IsCoachAsync()) return Forbid();
        if (Validate(dto) is { } error) return BadRequest(new { message = error });

        var t = await Query().FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound();
        if (!CanModify(t)) return Forbid();

        t.Name = dto.Name.Trim();
        t.Description = dto.Description;
        context.TrainingTemplateParts.RemoveRange(t.Parts);
        t.Parts = await BuildPartsAsync(dto);
        await context.SaveChangesAsync();
        return Ok((await ToDtosAsync([t]))[0]);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await IsCoachAsync()) return Forbid();
        var t = await context.TrainingTemplates.FindAsync(id);
        if (t == null) return NotFound();
        if (!CanModify(t)) return Forbid();
        context.TrainingTemplates.Remove(t);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
