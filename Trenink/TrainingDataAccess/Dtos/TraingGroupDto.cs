namespace TrainingDataAccess.Dtos;

public class TraingGroupDto
{
    public int TrainingPartId { get; set; }
    public string? Name { get; set; }
    public List<ActivityDto> Activities { get; set; } = new List<ActivityDto>();


}