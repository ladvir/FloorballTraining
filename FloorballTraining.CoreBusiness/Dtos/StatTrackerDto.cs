namespace FloorballTraining.CoreBusiness.Dtos;

public class StatTrackerDto : BaseEntityDto
{
    public int EventCategory { get; set; }
    public int? TournamentMatchId { get; set; }
    public int? AppointmentId { get; set; }
    public int TeamId { get; set; }
    public string? TeamName { get; set; }
    public int? SeasonId { get; set; }
    public string? SeasonName { get; set; }
    public int? MatchLineupId { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string? OpponentName { get; set; }
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
    public int? MatchPeriodCount { get; set; }
    public int? MatchPartDurationMinutes { get; set; }
    public int? CurrentPeriod { get; set; }
    /// <summary>Per-period breakdown of home/away score (1-based key)</summary>
    public Dictionary<int, int> HomeScoreByPeriod { get; set; } = new();
    public Dictionary<int, int> AwayScoreByPeriod { get; set; } = new();

    public string? EventName { get; set; }
    public DateTime? EventDate { get; set; }

    public List<StatTrackerParticipantDto> Participants { get; set; } = [];
    public List<StatTrackerMetricDto> Metrics { get; set; } = [];
    public List<StatTrackerAggregateDto> Aggregates { get; set; } = [];
    public List<StatTrackerEntryDto> RecentEntries { get; set; } = [];
}

public class StatTrackerParticipantDto : BaseEntityDto
{
    public int MemberId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int Role { get; set; }
    public int SortOrder { get; set; }
}

public class StatTrackerMetricDto : BaseEntityDto
{
    public string Code { get; set; } = "custom";
    public string Name { get; set; } = null!;
    public bool IsGoalkeeper { get; set; }
    public int SortOrder { get; set; }
}

public class StatTrackerEntryDto : BaseEntityDto
{
    public int Kind { get; set; }
    public int? ParticipantId { get; set; }
    public int? MetricId { get; set; }
    public int Delta { get; set; }
    public int? Period { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StatTrackerAggregateDto
{
    public int ParticipantId { get; set; }
    public int MetricId { get; set; }
    public int Total { get; set; }
    /// <summary>Per-period totals (1-based key)</summary>
    public Dictionary<int, int> ByPeriod { get; set; } = new();
}

public class TeamStatMetricTemplateDto : BaseEntityDto
{
    public int TeamId { get; set; }
    public string Name { get; set; } = null!;
    public bool IsGoalkeeper { get; set; }
    public string AppliesTo { get; set; } = "both";
    public int SortOrder { get; set; }
}

/// <summary>Per-event row for player profile / team summary.</summary>
public class StatTrackerEventSummaryDto
{
    public int TrackerId { get; set; }
    public int EventCategory { get; set; }
    public int? TournamentMatchId { get; set; }
    public int? TournamentId { get; set; }
    public string? TournamentName { get; set; }
    public int? AppointmentId { get; set; }
    public string? EventName { get; set; }
    public DateTime EventDate { get; set; }
    public int TeamId { get; set; }
    public string? TeamName { get; set; }
    public int? SeasonId { get; set; }
    public string? SeasonName { get; set; }
    /// <summary>Aggregated metric totals (key = metric code or name).</summary>
    public Dictionary<string, int> Metrics { get; set; } = new();
}

public class PlayerStatsBySeasonDto
{
    public int? SeasonId { get; set; }
    public string? SeasonName { get; set; }
    public int EventCategory { get; set; }
    public int EventCount { get; set; }
    public Dictionary<string, int> Totals { get; set; } = new();
    public List<StatTrackerEventSummaryDto> Events { get; set; } = [];
}

public class TeamStatsBySeasonDto
{
    public int? SeasonId { get; set; }
    public string? SeasonName { get; set; }
    public int EventCategory { get; set; }
    public int EventCount { get; set; }
    public Dictionary<string, int> Totals { get; set; } = new();
    public List<TeamPlayerSeasonRowDto> Players { get; set; } = [];
}

public class TeamPlayerSeasonRowDto
{
    public int MemberId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int EventCount { get; set; }
    public Dictionary<string, int> Totals { get; set; } = new();
}
