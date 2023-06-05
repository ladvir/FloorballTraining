namespace FloorballTraining.CoreBusiness;

public class ActivityAgeGroup
{
    public int? ActivityAgeGroupId { get; set; }

    public Activity Activity { get; set; } = new();
    public int ActivityId { get; set; }

    public AgeGroup AgeGroup { get; set; }
}