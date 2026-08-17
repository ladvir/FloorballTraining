namespace FloorballTraining.CoreBusiness;

public class TeamStatMetricTemplate : BaseEntity
{
    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public string Name { get; set; } = null!;

    public bool IsGoalkeeper { get; set; }

    /// <summary>"match" | "training" | "both"</summary>
    public string AppliesTo { get; set; } = "both";

    public int SortOrder { get; set; }
}
