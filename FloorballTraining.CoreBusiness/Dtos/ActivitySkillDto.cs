namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivitySkillDto : BaseEntityDto
{
    public int? ActivityId { get; set; }
    public ActivityDto? Activity { get; set; }

    public int? SkillId { get; set; }
    public string? SkillName { get; set; }
    public int? SkillCategoryId { get; set; }
    public string? SkillCategoryName { get; set; }
}
