namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Systémová (globální) šablona tréninku — kostra částí s volitelnými aktivitami.
/// Do tréninku se kopíruje, žádná vazba zpět na šablonu nezůstává.
/// </summary>
public class TrainingTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<TrainingTemplatePart> Parts { get; set; } = [];
}

public class TrainingTemplatePart : BaseEntity
{
    public int TrainingTemplateId { get; set; }
    public TrainingTemplate? TrainingTemplate { get; set; }

    public string? Name { get; set; }
    public string? Description { get; set; }
    public int Duration { get; set; }
    public int Order { get; set; }

    public List<TrainingTemplatePartActivity> Activities { get; set; } = [];
}

public class TrainingTemplatePartActivity : BaseEntity
{
    public int TrainingTemplatePartId { get; set; }
    public TrainingTemplatePart? TrainingTemplatePart { get; set; }

    public int ActivityId { get; set; }
    public Activity? Activity { get; set; }
}
