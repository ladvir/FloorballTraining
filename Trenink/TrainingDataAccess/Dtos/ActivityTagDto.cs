namespace TrainingDataAccess.Dtos;

public class ActivityTagDto
{

    public int ActivityId { get; set; }
    public ActivityDto Activity { get; set; } = null!;

    public int TagId { get; set; }
    public TagDto Tag { get; set; } = null!;
}