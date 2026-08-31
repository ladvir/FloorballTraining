using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>Verdict of a team's season, derived from goal fulfilment (or a coach override).</summary>
public enum SeasonVerdict
{
    /// <summary>Season still running and not everything is met yet.</summary>
    Pending = 0,
    Successful = 1,
    /// <summary>Season over, at least half the goals met.</summary>
    Partial = 2,
    Unsuccessful = 3,
}

/// <summary>Write side — one goal as sent from the form.</summary>
public class SeasonGoalInputDto
{
    public int SeasonId { get; set; }
    public int TeamId { get; set; }
    public SeasonGoalMetric Metric { get; set; }
    public int? TestDefinitionId { get; set; }
    public SeasonGoalDirection Direction { get; set; }
    public double Target { get; set; }
    public double? ManualValue { get; set; }
    public string? Note { get; set; }
}

/// <summary>Read side — one goal plus its live progress.</summary>
public class SeasonGoalDto
{
    public int Id { get; set; }
    public int SeasonId { get; set; }
    public int TeamId { get; set; }
    public SeasonGoalMetric Metric { get; set; }
    public int? TestDefinitionId { get; set; }
    public string? TestName { get; set; }
    public string? TestUnit { get; set; }
    public SeasonGoalDirection Direction { get; set; }
    public double Target { get; set; }
    public double? ManualValue { get; set; }
    public string? Note { get; set; }

    /// <summary>Computed now from existing data (null when nothing can be measured yet).</summary>
    public double? CurrentValue { get; set; }
    public bool Achieved { get; set; }
    /// <summary>0–100, clamped; how far <see cref="CurrentValue"/> is toward <see cref="Target"/>.</summary>
    public double ProgressPercent { get; set; }
}

/// <summary>Full season-goals view for one team.</summary>
public class TeamSeasonGoalsDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int? SeasonId { get; set; }
    public string? SeasonName { get; set; }
    public DateTime? SeasonStart { get; set; }
    public DateTime? SeasonEnd { get; set; }
    public bool CanManage { get; set; }

    public List<SeasonGoalDto> Goals { get; set; } = [];

    public int AchievedCount { get; set; }
    public int TotalCount { get; set; }
    public SeasonVerdict Verdict { get; set; }
    /// <summary>True when <see cref="Verdict"/> comes from a coach override row, not from the goals.</summary>
    public bool VerdictOverridden { get; set; }
    public string? OverrideNote { get; set; }
}

/// <summary>One row of the club-level rollup: how a team stands against its season goals.</summary>
public class ClubSeasonGoalRowDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int AchievedCount { get; set; }
    public int TotalCount { get; set; }
    public SeasonVerdict Verdict { get; set; }
    public bool VerdictOverridden { get; set; }
}
