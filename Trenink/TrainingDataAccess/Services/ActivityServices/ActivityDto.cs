namespace TrainingDataAccess.Services.ActivityServices;

public class ActivityDto
{
    public ActivityDto() { }

    public ActivityDto(ActivityDto activity)
    {
        ActivityId = activity.ActivityId;
        Name = activity.Name;
        Description = activity.Description;
        PersonsMin = activity.PersonsMin;
        PersonsMax = activity.PersonsMax;
        DurationMin = activity.DurationMin;
        DurationMax = activity.DurationMax;
        TagIds = new List<int>(activity.TagIds);
    }

    public int ActivityId { get; set; }

    public string Name { get; set; }
    public string Description { get; set; }
    public int? PersonsMin { get; set; }
    public int? PersonsMax { get; set; }
    public int? DurationMin { get; set; }
    public int? DurationMax { get; set; }
    public IList<int> TagIds { get; set; } = new List<int>();
}