namespace FloorballTraining.CoreBusiness.Dtos;

public class TrainingTagDto : BaseEntityDto
{
    public int? TrainingId { get; set; }

    public int? TagId { get; set; }
    public TagDto? Tag { get; set; }
}
