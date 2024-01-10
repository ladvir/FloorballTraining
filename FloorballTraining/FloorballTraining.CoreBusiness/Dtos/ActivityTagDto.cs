namespace FloorballTraining.CoreBusiness.Dtos;

public class ActivityTagDto : BaseEntityDto
{
    public int? ActivityId { get; set; }
    public ActivityDto? Activity { get; set; }

    public int? TagId { get; set; }
    public TagDto? Tag { get; set; }
}