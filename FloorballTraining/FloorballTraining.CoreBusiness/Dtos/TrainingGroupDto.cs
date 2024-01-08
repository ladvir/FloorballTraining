namespace FloorballTraining.CoreBusiness.Dtos;

public class TrainingGroupDto : BaseEntityDto
{
    public int PersonsMax { get; set; }

    public int PersonsMin { get; set; }

    public ActivityDto? Activity { get; set; }
}