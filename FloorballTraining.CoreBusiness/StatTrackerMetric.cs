namespace FloorballTraining.CoreBusiness;

public class StatTrackerMetric : BaseEntity
{
    public int StatTrackerId { get; set; }
    public StatTracker? StatTracker { get; set; }

    /// <summary>"goals" | "assists" | "saves" | "custom"</summary>
    public string Code { get; set; } = "custom";

    public string Name { get; set; } = null!;

    /// <summary>If true, applies only to goalkeeper participants (e.g. "saves").</summary>
    public bool IsGoalkeeper { get; set; }

    public int SortOrder { get; set; }
}
