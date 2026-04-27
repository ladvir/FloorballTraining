using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class FormationTemplatesController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService) : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private static FormationTemplateDto ToDto(FormationTemplate t) => new()
    {
        Id = t.Id,
        ClubId = t.ClubId,
        Name = t.Name,
        FormationSize = t.FormationSize,
        IncludesGoalie = t.IncludesGoalie,
        IsBuiltIn = t.IsBuiltIn,
        Slots = t.Slots
            .OrderBy(s => s.SortOrder)
            .Select(s => new FormationTemplateSlotDto
            {
                Id = s.Id,
                Position = s.Position,
                X = s.X,
                Y = s.Y,
                SortOrder = s.SortOrder
            }).ToList()
    };

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        var clubId = info.ClubId;

        var templates = await context.FormationTemplates
            .Include(t => t.Slots)
            .Where(t => t.IsBuiltIn || (clubId != null && t.ClubId == clubId))
            .OrderByDescending(t => t.IsBuiltIn)
            .ThenBy(t => t.Name)
            .ToListAsync();

        return Ok(templates.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        var template = await context.FormationTemplates
            .Include(t => t.Slots)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (template == null) return NotFound();
        if (!template.IsBuiltIn && template.ClubId != info.ClubId && info.EffectiveRole != "Admin")
            return NotFound();

        return Ok(ToDto(template));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FormationTemplateDto dto)
    {
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (info.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin"))
            return Forbid();
        if (info.ClubId == null && info.EffectiveRole != "Admin")
            return BadRequest(new { message = "Není nastaven aktivní klub." });

        var template = new FormationTemplate
        {
            ClubId = info.EffectiveRole == "Admin" ? dto.ClubId : info.ClubId,
            Name = dto.Name,
            FormationSize = dto.FormationSize,
            IncludesGoalie = dto.IncludesGoalie,
            IsBuiltIn = false,
            Slots = dto.Slots.Select(s => new FormationTemplateSlot
            {
                Position = s.Position,
                X = s.X,
                Y = s.Y,
                SortOrder = s.SortOrder
            }).ToList()
        };

        context.FormationTemplates.Add(template);
        await context.SaveChangesAsync();

        return Ok(ToDto(template));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] FormationTemplateDto dto)
    {
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (info.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin"))
            return Forbid();

        var template = await context.FormationTemplates
            .Include(t => t.Slots)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (template == null) return NotFound();
        if (template.IsBuiltIn) return BadRequest(new { message = "Vestavěné šablony nelze upravit." });
        if (template.ClubId != info.ClubId && info.EffectiveRole != "Admin")
            return Forbid();

        template.Name = dto.Name;
        template.FormationSize = dto.FormationSize;
        template.IncludesGoalie = dto.IncludesGoalie;

        context.FormationTemplateSlots.RemoveRange(template.Slots);
        template.Slots = dto.Slots.Select(s => new FormationTemplateSlot
        {
            Position = s.Position,
            X = s.X,
            Y = s.Y,
            SortOrder = s.SortOrder
        }).ToList();

        await context.SaveChangesAsync();
        return Ok(ToDto(template));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (info.EffectiveRole is not ("HeadCoach" or "ClubAdmin" or "Admin"))
            return Forbid();

        var template = await context.FormationTemplates.FindAsync(id);
        if (template == null) return NotFound();
        if (template.IsBuiltIn) return BadRequest(new { message = "Vestavěné šablony nelze smazat." });
        if (template.ClubId != info.ClubId && info.EffectiveRole != "Admin")
            return Forbid();

        var inUse = await context.MatchLineups.AnyAsync(l => l.FormationTemplateId == id);
        if (inUse) return BadRequest(new { message = "Šablona je použita v existující sestavě." });

        context.FormationTemplates.Remove(template);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
