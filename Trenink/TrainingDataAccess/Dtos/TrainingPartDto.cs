namespace TrainingDataAccess.Dtos;

public class TrainingPartDto
{
    public int TrainingPartId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public int Duration { get; set; }

    public List<TraingGroupDto> TraingGroups { get; set; } = new List<TraingGroupDto>();

    public int TrainingId { get; set; }

    public int Order { get; set; }

    public TrainingPartDto()
    {
    }
}