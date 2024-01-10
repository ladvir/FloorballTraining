namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivityAgeGroupDto : BaseEntityDto
{
    public ActivityDto? Activity { get; set; }
    public int? ActivityId { get; set; }

    public AgeGroupDto? AgeGroup { get; set; }

    public int AgeGroupId { get; set; }
}