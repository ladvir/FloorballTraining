namespace FloorballTraining.CoreBusiness;

public class TrainingAgeGroup : BaseEntity
{

    public Training? Training { get; set; }
    public int? TrainingId { get; set; }

    public AgeGroup? AgeGroup { get; set; }
    public int? AgeGroupId { get; set; }

    public TrainingAgeGroup Clone()
    {
        return new TrainingAgeGroup
        {
            Id = Id,
            Training = Training,
            TrainingId = TrainingId,
            AgeGroup = AgeGroup,
            AgeGroupId = AgeGroupId
        };
    }
}