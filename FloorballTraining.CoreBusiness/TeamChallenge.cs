namespace FloorballTraining.CoreBusiness;

/// <summary>The rolling period a team challenge resets on. Adds <see cref="Custom"/> (a coach-picked
/// date range) to the individual challenge windows — the idempotence window for a completion.</summary>
public enum TeamChallengeWindow { Week, Month, Season, Custom }

/// <summary>
/// A coach-authored challenge for a whole team (#156), on top of the individual static catalog (#108).
/// Two flavours:
/// <list type="bullet">
///   <item><b>Derived</b> (<see cref="IsManual"/> = false): a <see cref="ChallengeMetric"/> summed across
///   the team roster over the <see cref="Window"/>; when the total reaches <see cref="Target"/> in a
///   window it completes for every rostered player — unfalsifiable, same source data as XP.</item>
///   <item><b>Manual</b> (<see cref="IsManual"/> = true): a free-text goal the coach marks done by hand.</item>
/// </list>
/// A completion earns each rostered player <see cref="RewardXp"/> via the ledger
/// (Type=TeamChallengeReward, SourceKind=TeamChallenge). Mirrors the club/team-scoped config pattern of
/// <see cref="ClubReward"/> / <see cref="XpRuleConfig"/>, but always team-scoped (no club-wide row).
/// </summary>
public class TeamChallenge : BaseEntity, IAuditable
{
    public int TeamId { get; set; }
    public Team? Team { get; set; }

    /// <summary>Coach free text (Manual) or a label for a derived challenge.</summary>
    public string Name { get; set; } = "";
    public string? Description { get; set; }

    /// <summary>True = coach marks completion by hand; <see cref="Metric"/>/<see cref="Target"/> are ignored.</summary>
    public bool IsManual { get; set; }

    /// <summary>The summed metric for a derived challenge; null when <see cref="IsManual"/>.</summary>
    public ChallengeMetric? Metric { get; set; }

    /// <summary>Team-total target for a derived challenge; ignored when <see cref="IsManual"/>.</summary>
    public int Target { get; set; }

    public TeamChallengeWindow Window { get; set; }

    /// <summary>Used when <see cref="Window"/> = <see cref="TeamChallengeWindow.Custom"/> (and natural for Manual).</summary>
    public DateTime? StartsOn { get; set; }
    public DateTime? EndsOn { get; set; }

    /// <summary>XP awarded to each rostered player when the challenge completes in a window.</summary>
    public int RewardXp { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
