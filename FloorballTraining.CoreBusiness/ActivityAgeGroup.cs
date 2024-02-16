namespace FloorballTraining.CoreBusiness;

public class ActivityAgeGroup : BaseEntity
{
    public Activity? Activity { get; set; }
    public int? ActivityId { get; set; }

    public AgeGroup? AgeGroup { get; set; }

    public int? AgeGroupId { get; set; }
}