namespace FloorballTraining.CoreBusiness.Dtos;

public class TrainingTemplateDto : BaseEntityDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalDuration { get; set; }
    public bool CanEdit { get; set; }

    public List<TrainingTemplatePartDto> Parts { get; set; } = [];
}

public class TrainingTemplatePartDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int Duration { get; set; }
    public int Order { get; set; }

    /// <summary>Aktivity části (volitelné — prázdný seznam = jen kostra).</summary>
    public List<int> ActivityIds { get; set; } = [];
}
