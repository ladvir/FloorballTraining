namespace FloorballTraining.CoreBusiness.Dtos;

public class TeamTrainingDto : BaseEntityDto
{
    public int TeamId { get; set; }
    public TeamDto Team { get; set; } = null!;

    public int TrainingId { get; set; }
    public TrainingDto Training { get; set; } = null!;
}
