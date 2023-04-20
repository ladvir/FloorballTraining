namespace FloorballTraining.CoreBusiness;

public class TrainingGroupActivity
{
    public int TrainingGroupId { get; set; }

    public TrainingGroup? TrainingGroup { get; set; }

    public int ActivityId { get; set; }
    public Activity? Activity { get; set; }

    public int Duration { get; set; } = 180;
}