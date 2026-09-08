namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>One team challenge (#156) with its live progress for the current window. Name/Description are
/// coach free text (unlike the individual catalog #108 which uses i18n keys).</summary>
public class TeamChallengeDto
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }

    public bool IsManual { get; set; }
    /// <summary><c>ChallengeMetric</c> name; null when <see cref="IsManual"/>.</summary>
    public string? Metric { get; set; }
    public int Target { get; set; }
    /// <summary><c>TeamChallengeWindow</c> name: Week | Month | Season | Custom.</summary>
    public string Window { get; set; } = "";
    public DateTime? StartsOn { get; set; }
    public DateTime? EndsOn { get; set; }
    public int RewardXp { get; set; }
    public bool IsActive { get; set; }

    // --- Live progress for the current window (derived challenges) / lifetime state (manual) ---
    /// <summary>The window this progress belongs to, e.g. "2026-W31"; null when no window resolves now.</summary>
    public string? PeriodKey { get; set; }
    /// <summary>Team-summed progress count in the window (clamped to <see cref="Target"/> for display).</summary>
    public int Current { get; set; }
    /// <summary>0..1.</summary>
    public double Progress { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    /// <summary>How many rostered players have a completion row for the current window.</summary>
    public int CompletedMembers { get; set; }

    /// <summary>Whether the caller may edit/delete this challenge (set by the controller).</summary>
    public bool CanManage { get; set; }
}

/// <summary>Create/update payload for a team challenge.</summary>
public class SaveTeamChallengeDto
{
    public int TeamId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool IsManual { get; set; }
    /// <summary><c>ChallengeMetric</c> name; required unless <see cref="IsManual"/>.</summary>
    public string? Metric { get; set; }
    public int Target { get; set; }
    /// <summary><c>TeamChallengeWindow</c> name.</summary>
    public string Window { get; set; } = "";
    public DateTime? StartsOn { get; set; }
    public DateTime? EndsOn { get; set; }
    public int RewardXp { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>A team's challenge board: the definitions + whether the caller may manage them.</summary>
public class TeamChallengeListDto
{
    public bool CanManage { get; set; }
    public List<TeamChallengeDto> Challenges { get; set; } = [];
}
