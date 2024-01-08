namespace FloorballTraining.CoreBusiness.Dtos;

public class TrainingPartDto : BaseEntityDto
{
    public string? Name { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public int Order { get; set; }
    public int Duration { get; set; }

    public List<TrainingGroupDto>? TrainingGroups { get; set; }
}