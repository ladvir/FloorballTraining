using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

[Authorize]
public class TestDefinitionsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService) : BaseApiController
{
    private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private async Task<bool> IsCoachOrAboveAsync()
    {
        if (User.IsInRole("Admin")) return true;
        var info = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        return info.EffectiveRole is "Admin" or "ClubAdmin" or "HeadCoach" or "Coach";
    }

    private static TestDefinitionDto ToDto(TestDefinition t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Description = t.Description,
        TestType = t.TestType,
        Category = t.Category,
        Unit = t.Unit,
        HigherIsBetter = t.HigherIsBetter,
        ClubId = t.ClubId,
        IsTemplate = t.IsTemplate,
        SortOrder = t.SortOrder,
        SkillId = t.SkillId,
        SkillName = t.Skill?.Name,
        SkillCategoryName = t.Skill?.SkillCategory?.Name,
        GradeOptions = t.GradeOptions.OrderBy(g => g.SortOrder).Select(g => new GradeOptionDto
        {
            Id = g.Id,
            TestDefinitionId = g.TestDefinitionId,
            Label = g.Label,
            NumericValue = g.NumericValue,
            Colour = g.Colour,
            SortOrder = g.SortOrder,
            SkillGrade = g.SkillGrade
        }).ToList(),
        ColourRanges = t.ColourRanges.Select(c => new TestColourRangeDto
        {
            Id = c.Id,
            TestDefinitionId = c.TestDefinitionId,
            AgeGroupId = c.AgeGroupId,
            AgeGroupName = c.AgeGroup?.Name,
            Gender = c.Gender,
            GreenFrom = c.GreenFrom,
            GreenTo = c.GreenTo,
            YellowFrom = c.YellowFrom,
            YellowTo = c.YellowTo
        }).ToList(),
        SkillGradeRanges = t.SkillGradeRanges.Select(c => new TestSkillGradeRangeDto
        {
            Id = c.Id,
            TestDefinitionId = c.TestDefinitionId,
            AgeGroupId = c.AgeGroupId,
            AgeGroupName = c.AgeGroup?.Name,
            Gender = c.Gender,
            Grade1From = c.Grade1From,
            Grade1To = c.Grade1To,
            Grade2From = c.Grade2From,
            Grade2To = c.Grade2To,
            Grade3From = c.Grade3From,
            Grade3To = c.Grade3To,
            Grade4From = c.Grade4From,
            Grade4To = c.Grade4To
        }).ToList(),
        ResultCount = t.Results.Count
    };

    /// <summary>GET /testdefinitions</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? clubId,
        [FromQuery] TestCategory? category,
        [FromQuery] TestType? testType,
        [FromQuery] string? search)
    {
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);

        var query = context.TestDefinitions
            .Include(t => t.GradeOptions)
            .Include(t => t.ColourRanges).ThenInclude(c => c.AgeGroup)
            .Include(t => t.SkillGradeRanges).ThenInclude(c => c.AgeGroup)
            .Include(t => t.Skill).ThenInclude(s => s!.SkillCategory)
            .Include(t => t.Results)
            .AsQueryable();

        // Filter by active club (admin included)
        var effectiveClubId = clubId ?? roleInfo.ClubId;
        if (effectiveClubId.HasValue)
            query = query.Where(t => t.ClubId == effectiveClubId.Value || t.IsTemplate);
        else
            query = query.Where(t => t.IsTemplate);

        if (category.HasValue)
            query = query.Where(t => t.Category == category.Value);
        if (testType.HasValue)
            query = query.Where(t => t.TestType == testType.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(t => t.Name.Contains(search));

        var tests = await query.OrderBy(t => t.SortOrder).ThenBy(t => t.Name).ToListAsync();
        return Ok(tests.Select(ToDto));
    }

    /// <summary>GET /testdefinitions/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var test = await context.TestDefinitions
            .Include(t => t.GradeOptions)
            .Include(t => t.ColourRanges).ThenInclude(c => c.AgeGroup)
            .Include(t => t.SkillGradeRanges).ThenInclude(c => c.AgeGroup)
            .Include(t => t.Skill).ThenInclude(s => s!.SkillCategory)
            .Include(t => t.Results)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound();

        // Filter by active club (admin included)
        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.ClubId.HasValue && !test.IsTemplate && test.ClubId != roleInfo.ClubId)
            return NotFound();

        return Ok(ToDto(test));
    }

    /// <summary>GET /testdefinitions/{id}/pdf?teamId=&amp;testDate= — printable A4 form for recording results by hand</summary>
    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> GetPdf(int id, [FromQuery] int? teamId, [FromQuery] DateTime? testDate)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();

        var test = await context.TestDefinitions
            .Include(t => t.GradeOptions)
            .Include(t => t.ColourRanges).ThenInclude(c => c.AgeGroup)
            .Include(t => t.SkillGradeRanges).ThenInclude(c => c.AgeGroup)
            .Include(t => t.Skill).ThenInclude(s => s!.SkillCategory)
            .Include(t => t.Results)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound();

        var roleInfo = await clubRoleService.GetUserClubRoleAsync(GetCurrentUserId()!);
        if (roleInfo.ClubId.HasValue && !test.IsTemplate && test.ClubId != roleInfo.ClubId)
            return NotFound();

        var playerNames = new List<string>();
        string? teamName = null;
        if (teamId is > 0)
        {
            teamName = await context.Teams
                .Where(t => t.Id == teamId.Value)
                .Select(t => t.Name)
                .FirstOrDefaultAsync();

            var players = await context.TeamMembers
                .Where(tm => tm.TeamId == teamId.Value && tm.IsPlayer && tm.Member != null)
                .Select(tm => new { tm.Member!.LastName, tm.Member.FirstName })
                .ToListAsync();

            // Alphabetical by surname, then first name, using Czech collation
            var czech = System.Globalization.CultureInfo.GetCultureInfo("cs-CZ");
            var comparer = StringComparer.Create(czech, ignoreCase: true);
            playerNames = players
                .OrderBy(p => p.LastName, comparer)
                .ThenBy(p => p.FirstName, comparer)
                .Select(p => $"{p.LastName} {p.FirstName}".Trim())
                .ToList();
        }

        var document = new Reporting.TestFormDocument(ToDto(test), playerNames, teamName, testDate);
        var bytes = await Task.Run(document.GeneratePdfBytes);

        return File(bytes, "application/pdf", $"test-{id}-formular.pdf");
    }

    /// <summary>POST /testdefinitions</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TestDefinitionDto dto)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();

        var test = new TestDefinition
        {
            Name = dto.Name,
            Description = dto.Description,
            TestType = dto.TestType,
            Category = dto.Category,
            Unit = dto.Unit,
            HigherIsBetter = dto.HigherIsBetter,
            ClubId = dto.ClubId,
            IsTemplate = false,
            SortOrder = dto.SortOrder,
            SkillId = dto.SkillId,
            GradeOptions = dto.GradeOptions.Select(g => new GradeOption
            {
                Label = g.Label,
                NumericValue = g.NumericValue,
                Colour = g.Colour,
                SortOrder = g.SortOrder,
                SkillGrade = g.SkillGrade
            }).ToList(),
            ColourRanges = dto.ColourRanges.Select(c => new TestColourRange
            {
                AgeGroupId = c.AgeGroupId,
                Gender = c.Gender,
                GreenFrom = c.GreenFrom,
                GreenTo = c.GreenTo,
                YellowFrom = c.YellowFrom,
                YellowTo = c.YellowTo
            }).ToList(),
            SkillGradeRanges = dto.SkillGradeRanges.Select(c => new TestSkillGradeRange
            {
                AgeGroupId = c.AgeGroupId,
                Gender = c.Gender,
                Grade1From = c.Grade1From,
                Grade1To = c.Grade1To,
                Grade2From = c.Grade2From,
                Grade2To = c.Grade2To,
                Grade3From = c.Grade3From,
                Grade3To = c.Grade3To,
                Grade4From = c.Grade4From,
                Grade4To = c.Grade4To
            }).ToList()
        };

        context.TestDefinitions.Add(test);
        await context.SaveChangesAsync();

        await LoadSkillNavAsync(test);
        return Ok(ToDto(test));
    }

    /// <summary>PUT /testdefinitions/{id}</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TestDefinitionDto dto)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();

        var test = await context.TestDefinitions
            .Include(t => t.GradeOptions)
            .Include(t => t.ColourRanges)
            .Include(t => t.SkillGradeRanges)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound();

        test.Name = dto.Name;
        test.Description = dto.Description;
        test.TestType = dto.TestType;
        test.Category = dto.Category;
        test.Unit = dto.Unit;
        test.HigherIsBetter = dto.HigherIsBetter;
        test.SortOrder = dto.SortOrder;
        test.SkillId = dto.SkillId;

        // Update grade options - remove old, add new
        context.GradeOptions.RemoveRange(test.GradeOptions);
        test.GradeOptions = dto.GradeOptions.Select(g => new GradeOption
        {
            Label = g.Label,
            NumericValue = g.NumericValue,
            Colour = g.Colour,
            SortOrder = g.SortOrder,
            SkillGrade = g.SkillGrade
        }).ToList();

        // Update colour ranges - remove old, add new
        context.TestColourRanges.RemoveRange(test.ColourRanges);
        test.ColourRanges = dto.ColourRanges.Select(c => new TestColourRange
        {
            AgeGroupId = c.AgeGroupId,
            Gender = c.Gender,
            GreenFrom = c.GreenFrom,
            GreenTo = c.GreenTo,
            YellowFrom = c.YellowFrom,
            YellowTo = c.YellowTo
        }).ToList();

        // Update skill-grade ranges - remove old, add new
        context.TestSkillGradeRanges.RemoveRange(test.SkillGradeRanges);
        test.SkillGradeRanges = dto.SkillGradeRanges.Select(c => new TestSkillGradeRange
        {
            AgeGroupId = c.AgeGroupId,
            Gender = c.Gender,
            Grade1From = c.Grade1From,
            Grade1To = c.Grade1To,
            Grade2From = c.Grade2From,
            Grade2To = c.Grade2To,
            Grade3From = c.Grade3From,
            Grade3To = c.Grade3To,
            Grade4From = c.Grade4From,
            Grade4To = c.Grade4To
        }).ToList();

        await context.SaveChangesAsync();

        await LoadSkillNavAsync(test);
        return Ok(ToDto(test));
    }

    /// <summary>
    /// Populates test.Skill (and its category) after a scalar SkillId assignment — changing
    /// the FK alone doesn't fix up the reference navigation, so the very next ToDto call would
    /// otherwise report a stale/null SkillName even though SkillId itself just saved correctly.
    /// </summary>
    private async Task LoadSkillNavAsync(TestDefinition test)
    {
        test.Skill = test.SkillId.HasValue
            ? await context.Skills.Include(s => s.SkillCategory).FirstOrDefaultAsync(s => s.Id == test.SkillId.Value)
            : null;
    }

    /// <summary>DELETE /testdefinitions/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!User.IsInRole("Admin")) return Forbid();

        var test = await context.TestDefinitions
            .Include(t => t.Results)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound();

        if (test.Results.Count > 0)
            return BadRequest(new { message = "Nelze smazat test s existujícími výsledky." });

        context.TestDefinitions.Remove(test);
        await context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>POST /testdefinitions/import-template — import Florbal 2021 templates into club</summary>
    [HttpPost("import-template")]
    public async Task<IActionResult> ImportTemplate([FromQuery] int clubId)
    {
        if (!await IsCoachOrAboveAsync()) return Forbid();

        var templates = await context.TestDefinitions
            .Include(t => t.GradeOptions)
            .Include(t => t.ColourRanges)
            .Include(t => t.SkillGradeRanges)
            .Where(t => t.IsTemplate)
            .ToListAsync();

        if (templates.Count == 0)
            return BadRequest(new { message = "Žádné šablony k importu." });

        // Check if already imported for this club
        var existingNames = await context.TestDefinitions
            .Where(t => t.ClubId == clubId && !t.IsTemplate)
            .Select(t => t.Name)
            .ToListAsync();

        var imported = 0;
        foreach (var template in templates)
        {
            if (existingNames.Contains(template.Name))
                continue;

            var copy = new TestDefinition
            {
                Name = template.Name,
                Description = template.Description,
                TestType = template.TestType,
                Category = template.Category,
                Unit = template.Unit,
                HigherIsBetter = template.HigherIsBetter,
                ClubId = clubId,
                IsTemplate = false,
                SortOrder = template.SortOrder,
                SkillId = template.SkillId,
                GradeOptions = template.GradeOptions.Select(g => new GradeOption
                {
                    Label = g.Label,
                    NumericValue = g.NumericValue,
                    Colour = g.Colour,
                    SortOrder = g.SortOrder,
                    SkillGrade = g.SkillGrade
                }).ToList(),
                ColourRanges = template.ColourRanges.Select(c => new TestColourRange
                {
                    AgeGroupId = c.AgeGroupId,
                    Gender = c.Gender,
                    GreenFrom = c.GreenFrom,
                    GreenTo = c.GreenTo,
                    YellowFrom = c.YellowFrom,
                    YellowTo = c.YellowTo
                }).ToList(),
                SkillGradeRanges = template.SkillGradeRanges.Select(c => new TestSkillGradeRange
                {
                    AgeGroupId = c.AgeGroupId,
                    Gender = c.Gender,
                    Grade1From = c.Grade1From,
                    Grade1To = c.Grade1To,
                    Grade2From = c.Grade2From,
                    Grade2To = c.Grade2To,
                    Grade3From = c.Grade3From,
                    Grade3To = c.Grade3To,
                    Grade4From = c.Grade4From,
                    Grade4To = c.Grade4To
                }).ToList()
            };

            context.TestDefinitions.Add(copy);
            imported++;
        }

        await context.SaveChangesAsync();
        return Ok(new { imported, skipped = templates.Count - imported });
    }
}
