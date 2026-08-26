using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class SkillConverter
{
    public static SkillDto? ToDto(this Skill? entity)
    {
        if (entity == null) return null;

        return new SkillDto
        {
            Id = entity.Id,
            Name = entity.Name,
            SkillCategoryId = entity.SkillCategoryId,
            SkillCategoryName = entity.SkillCategory?.Name
        };
    }
}
