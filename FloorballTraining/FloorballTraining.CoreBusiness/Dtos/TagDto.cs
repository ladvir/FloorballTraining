namespace FloorballTraining.CoreBusiness.Dtos;

public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public string Color { get; set; } = string.Empty;

    public string? ParentTag { get; set; }

    public bool IsTrainingGoal { get; set; }

}