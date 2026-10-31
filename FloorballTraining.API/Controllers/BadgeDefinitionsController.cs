using System.Text.RegularExpressions;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

public class BadgeDefinitionDto
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Metric { get; set; } = "";
    public int Threshold { get; set; }
    public string Period { get; set; } = nameof(BadgePeriod.Lifetime);
    public bool Repeatable { get; set; }
    public string IconPath { get; set; } = "";
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>How many member badge rows exist for this code (read-only).</summary>
    public int EarnedCount { get; set; }
}

/// <summary>Admin management of badge definitions: add, edit, remove (deactivate) and upload the icon.</summary>
[ApiController]
[Route("badges/definitions")]
[Authorize(Roles = "Admin")]
public partial class BadgeDefinitionsController(FloorballTrainingContext context, IWebHostEnvironment env) : ControllerBase
{
    private static readonly string[] IconExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
    private const long MaxIconBytes = 1024 * 1024;

    [GeneratedRegex("^[A-Za-z0-9_]{2,64}$")]
    private static partial Regex CodePattern();

    [HttpGet]
    public async Task<ActionResult<List<BadgeDefinitionDto>>> GetAll(CancellationToken ct)
    {
        await BadgeService.EnsureSeededAsync(context, ct);
        var counts = await context.MemberBadges.AsNoTracking()
            .GroupBy(b => b.Code).Select(g => new { g.Key, N = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.N, ct);
        var defs = await context.BadgeDefinitions.AsNoTracking().OrderBy(d => d.Id).ToListAsync(ct);
        return defs.Select(d => ToDto(d, counts.GetValueOrDefault(d.Code))).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<BadgeDefinitionDto>> Create(BadgeDefinitionDto dto, CancellationToken ct)
    {
        await BadgeService.EnsureSeededAsync(context, ct);
        var def = new BadgeDefinition();
        if (Apply(def, dto, isNew: true) is { } error) return BadRequest(error);
        if (await context.BadgeDefinitions.AnyAsync(d => d.Code == def.Code, ct))
            return Conflict("A badge with this code already exists.");
        context.BadgeDefinitions.Add(def);
        await context.SaveChangesAsync(ct);
        return ToDto(def, 0);
    }

    /// <summary>Code is immutable (earned badges reference it); everything else can change.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<BadgeDefinitionDto>> Update(int id, BadgeDefinitionDto dto, CancellationToken ct)
    {
        var def = await context.BadgeDefinitions.FindAsync([id], ct);
        if (def == null) return NotFound();
        if (Apply(def, dto, isNew: false) is { } error) return BadRequest(error);
        await context.SaveChangesAsync(ct);
        return ToDto(def, await context.MemberBadges.CountAsync(b => b.Code == def.Code, ct));
    }

    /// <summary>Removes a never-earned badge outright; an earned one is only deactivated so members keep their history.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var def = await context.BadgeDefinitions.FindAsync([id], ct);
        if (def == null) return NotFound();
        if (await context.MemberBadges.AnyAsync(b => b.Code == def.Code, ct)) def.IsActive = false;
        else context.BadgeDefinitions.Remove(def);
        await context.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:int}/icon")]
    [RequestSizeLimit(MaxIconBytes + 4096)]
    public async Task<ActionResult<BadgeDefinitionDto>> UploadIcon(int id, IFormFile file, CancellationToken ct)
    {
        var def = await context.BadgeDefinitions.FindAsync([id], ct);
        if (def == null) return NotFound();
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (file.Length == 0 || file.Length > MaxIconBytes || !IconExtensions.Contains(ext))
            return BadRequest("Icon must be a png, jpg, webp or svg up to 1 MB.");

        var dir = Path.Combine(env.WebRootPath, "badges");
        Directory.CreateDirectory(dir);
        var name = $"{Guid.NewGuid():N}{ext}";
        await using (var stream = new FileStream(Path.Combine(dir, name), FileMode.CreateNew))
            await file.CopyToAsync(stream, ct);

        def.IconPath = $"badges/{name}";
        await context.SaveChangesAsync(ct);
        return ToDto(def, await context.MemberBadges.CountAsync(b => b.Code == def.Code, ct));
    }

    private static string? Apply(BadgeDefinition def, BadgeDefinitionDto dto, bool isNew)
    {
        if (!Enum.TryParse<BadgeMetric>(dto.Metric, out var metric)) return "Unknown metric.";
        if (!Enum.TryParse<BadgePeriod>(dto.Period, out var period)) return "Unknown period.";
        if (dto.Threshold < 1) return "Threshold must be at least 1.";
        if (isNew && !CodePattern().IsMatch(dto.Code)) return "Code must be 2-64 letters, digits or underscores.";

        // Season attendance is inherently per season; a season count has no dated source so it can only be lifetime.
        if (metric == BadgeMetric.SeasonAttendancePct) period = BadgePeriod.Season;
        else if (metric == BadgeMetric.SeasonsPlayed && period != BadgePeriod.Lifetime)
            return "Seasons played can only be a lifetime badge.";
        var repeatable = dto.Repeatable;
        if (repeatable && (period != BadgePeriod.Lifetime || !BadgeService.IsCumulative(metric)))
            return "Only cumulative lifetime badges can be repeatable (monthly/seasonal ones are earned again each period anyway).";

        if (isNew) def.Code = dto.Code;
        def.Metric = metric;
        def.Period = period;
        def.Threshold = dto.Threshold;
        def.Repeatable = repeatable;
        def.Name = string.IsNullOrWhiteSpace(dto.Name) ? null : dto.Name.Trim();
        def.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        def.IsActive = dto.IsActive;
        if (isNew) def.IconPath = string.IsNullOrWhiteSpace(dto.IconPath) ? "badges/custom.png" : dto.IconPath;
        return null;
    }

    private static BadgeDefinitionDto ToDto(BadgeDefinition d, int earned) => new()
    {
        Id = d.Id, Code = d.Code, Metric = d.Metric.ToString(), Threshold = d.Threshold, Period = d.Period.ToString(),
        Repeatable = d.Repeatable, IconPath = d.IconPath, Name = d.Name, Description = d.Description,
        IsActive = d.IsActive, EarnedCount = earned,
    };
}
