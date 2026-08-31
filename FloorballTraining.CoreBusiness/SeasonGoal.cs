using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// One quantified target a coach sets for a team in a season (e.g. "at least 12 wins",
/// "team sprint average under 3.2 s"). The row with <see cref="SeasonGoalMetric.OutcomeOverride"/>
/// is special — it is the coach's manual verdict for the team's season, not a tracked goal.
/// </summary>
public class SeasonGoal : BaseEntity, IAuditable
{
    public int SeasonId { get; set; }
    public Season? Season { get; set; }

    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public SeasonGoalMetric Metric { get; set; }

    /// <summary>Required for the test metrics, null otherwise.</summary>
    public int? TestDefinitionId { get; set; }
    public TestDefinition? TestDefinition { get; set; }

    public SeasonGoalDirection Direction { get; set; }

    /// <summary>Target value; for ManualProgress it is the "out of N", for OutcomeOverride it is unused.</summary>
    public double Target { get; set; }

    /// <summary>Coach-entered current value for the manual metrics and the verdict override (1 = success, 0 = fail).</summary>
    public double? ManualValue { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
