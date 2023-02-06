namespace TrainingDataAccess.Models;

public class TrainingPartActivity
{
    public int TrainingPartId { get; set; }
    public TrainingPart TrainingPart { get; set; }

    public int ActivityId { get; set; }
    public Activity Activity { get; set; }
}