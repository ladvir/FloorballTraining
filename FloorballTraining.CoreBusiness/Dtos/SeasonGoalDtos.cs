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

/// <summary>One player's value in a best-players ranking (scoring points / attendance % / reward count).</summary>
public class PlayerRankRowDto
{
    public int MemberId { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
}

/// <summary>One badge earned by a player — name/description are frontend i18n keys off <see cref="Code"/>.</summary>
public class BadgeEarnRowDto
{
    public int MemberId { get; set; }
    public string Name { get; set; } = string.Empty;
    /// <summary>A <see cref="Enums.BadgeCode"/> name, e.g. "Attendance10" — frontend i18n key is badge.{code}.name.</summary>
    public string Code { get; set; } = string.Empty;
    /// <summary>Relative path under wwwroot, e.g. "badges/attendance10.png".</summary>
    public string Icon { get; set; } = string.Empty;
}

/// <summary>One player's XP ranking row, plus their career level (lifetime XP) as of that point.</summary>
public class XpRankRowDto
{
    public int MemberId { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    /// <summary>0-based index into <see cref="XpProgression.Ranks"/> — the frontend derives the level icon from it.</summary>
    public int LevelIndex { get; set; }
    public string LevelName { get; set; } = string.Empty;
}

/// <summary>Best players for one calendar month, or for the whole season.</summary>
public class MonthlyTeamReportDto
{
    /// <summary>"2026-09" for a calendar month, or "season" for the season-total bucket.</summary>
    public string Label { get; set; } = string.Empty;
    public List<XpRankRowDto> TopXp { get; set; } = [];
    public List<PlayerRankRowDto> TopScoring { get; set; } = [];
    public List<PlayerRankRowDto> TopAttendance { get; set; } = [];
    public List<BadgeEarnRowDto> TopBadges { get; set; } = [];
    public List<PlayerRankRowDto> TopRewards { get; set; } = [];
}

/// <summary>Month-by-month + season-total best-players report for one team.</summary>
public class TeamSeasonReportDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int? SeasonId { get; set; }
    public string? SeasonName { get; set; }
    public DateTime? SeasonStart { get; set; }
    public DateTime? SeasonEnd { get; set; }
    public List<MonthlyTeamReportDto> Months { get; set; } = [];
    public MonthlyTeamReportDto? SeasonTotal { get; set; }
}
