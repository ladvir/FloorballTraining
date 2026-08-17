using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class SkillCategory : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public SkillCategoryPosition Position { get; set; }

    public int SortOrder { get; set; }

    public List<Skill> Skills { get; set; } = new();
}
