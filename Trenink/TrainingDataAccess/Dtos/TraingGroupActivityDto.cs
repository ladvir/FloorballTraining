namespace TrainingDataAccess.Dtos;

public class TrainingGroupActivityDto
{
    public int TrainingGroupId { get; set; }
    public int ActivityId { get; set; }

    public ActivityDto Activity { get; set; } = new ActivityDto();

    public TrainingGroupDto TrainingGroup { get; set; } = new TrainingGroupDto();

}