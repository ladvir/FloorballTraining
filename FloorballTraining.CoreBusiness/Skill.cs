namespace FloorballTraining.CoreBusiness;

public class Skill : BaseEntity
{
    public int SkillCategoryId { get; set; }
    public SkillCategory? SkillCategory { get; set; }

    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public List<PlayerSkillRating> Ratings { get; set; } = new();
}
