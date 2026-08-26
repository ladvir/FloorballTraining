using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class ActivitySkillConverter
{
    public static ActivitySkillDto? ToDto(this ActivitySkill? entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new ActivitySkillDto
        {
            Id = entity.Id,
            ActivityId = entity.ActivityId,
            SkillId = entity.Skill?.Id ?? entity.SkillId,
            SkillName = entity.Skill?.Name,
            SkillCategoryId = entity.Skill?.SkillCategoryId,
            SkillCategoryName = entity.Skill?.SkillCategory?.Name,
        };
    }
}
