namespace TrainingDataAccess.Models;

public class TrainingTrainingPart
{
    public int TrainingPartId { get; set; }
    public TrainingPart TrainingPart { get; set; }

    public int TrainingId { get; set; }
    public Training Training { get; set; }
}