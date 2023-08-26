namespace FloorballTraining.CoreBusiness;

public class TrainingAgeGroup
{
    public int? TrainingAgeGroupId { get; set; }

    public Training Training { get; set; } = new();
    public int TrainingId { get; set; }

    public AgeGroup AgeGroup { get; set; }
}