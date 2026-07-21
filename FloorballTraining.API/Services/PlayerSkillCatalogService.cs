using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

/// <summary>
/// Builds a member's skill categories (with each skill's latest grade) for the given
/// resolved position(s). Shared between PlayerSkillsController (the "Dovednosti" card, #91)
/// and MemberReportController (the report's skills section, #92) to avoid duplicating
/// this query logic.
/// </summary>
public interface IPlayerSkillCatalogService
{
    Task<List<PlayerSkillCategoryDto>> BuildCategoriesAsync(int memberId, IReadOnlyList<SkillCategoryPosition> positions);
}

public class PlayerSkillCatalogService(FloorballTrainingContext context, UserManager<AppUser> userManager)
    : IPlayerSkillCatalogService
{
    private async Task<string?> GetUserName(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user != null ? $"{user.FirstName} {user.LastName}".Trim() : null;
    }

    public async Task<List<PlayerSkillCategoryDto>> BuildCategoriesAsync(
        int memberId, IReadOnlyList<SkillCategoryPosition> positions)
    {
        var categories = await context.SkillCategories
            .Include(c => c.Skills)
            .Where(c => positions.Contains(c.Position))
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var skillIds = categories.SelectMany(c => c.Skills).Select(s => s.Id).ToList();
        var latestRatings = await context.PlayerSkillRatings
            .Where(r => r.MemberId == memberId && skillIds.Contains(r.SkillId))
            .ToListAsync();
        var latestBySkill = latestRatings
            .GroupBy(r => r.SkillId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.RatedAt).First());

        var categoryDtos = new List<PlayerSkillCategoryDto>();
        foreach (var category in categories)
        {
            var skillDtos = new List<PlayerSkillDto>();
            foreach (var skill in category.Skills.OrderBy(s => s.SortOrder))
            {
                latestBySkill.TryGetValue(skill.Id, out var rating);
                skillDtos.Add(new PlayerSkillDto
                {
                    SkillId = skill.Id,
                    Name = skill.Name,
                    SortOrder = skill.SortOrder,
                    Grade = rating?.Grade,
                    TargetGrade = rating?.TargetGrade,
                    Recommendation = rating?.Recommendation,
                    RatedAt = rating?.RatedAt,
                    RatedByUserName = rating != null ? await GetUserName(rating.RatedByAppUserId) : null,
                });
            }

            categoryDtos.Add(new PlayerSkillCategoryDto
            {
                CategoryId = category.Id,
                Name = category.Name,
                SortOrder = category.SortOrder,
                Position = category.Position.ToString(),
                Skills = skillDtos,
            });
        }

        return categoryDtos;
    }
}
