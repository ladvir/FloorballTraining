namespace TrainingDataAccess.Dtos;

public class TrainingGroupDto
{
    public int TrainingGroupId { get; set; }
    public int TrainingPartId { get; set; }
    public string? Name { get; set; }
    public List<ActivityDto> Activities { get; set; } = new List<ActivityDto>();


}