namespace TrainingDataAccess.Dtos;

public class TrainingPartDto
{
    public int TrainingPartId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public int Duration { get; set; }

    public List<TrainingGroupDto> TrainingGroups { get; set; } = new List<TrainingGroupDto>();

    public int TrainingId { get; set; }

    public int Order { get; set; }

    public TrainingPartDto()
    {
    }
}