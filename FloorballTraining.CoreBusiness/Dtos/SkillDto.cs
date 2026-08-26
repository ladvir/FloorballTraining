namespace FloorballTraining.CoreBusiness.Dtos;

public class SkillDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;

    public int SkillCategoryId { get; set; }

    public string? SkillCategoryName { get; set; }
}
