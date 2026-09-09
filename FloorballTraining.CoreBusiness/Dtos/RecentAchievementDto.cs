namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>One recent gamification milestone for the coach+ dashboard feed (#gamification): a badge
/// earned, or a career level / rank crossed, within the requested window.</summary>
public class RecentAchievementDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = "";

    /// <summary>"badge" | "level" | "rank".</summary>
    public string Kind { get; set; } = "";

    /// <summary>When it happened. Exact for a badge (its EarnedAt); the window's "now" for a level /
    /// rank move, since the XP ledger carries no per-level timestamp.</summary>
    public DateTime At { get; set; }

    // Kind == "badge"
    public string? BadgeCode { get; set; }
    public string? BadgeIcon { get; set; }

    // Kind == "level" | "rank" — the move made across the window.
    public int? FromLevel { get; set; }
    public int? ToLevel { get; set; }
    public int? FromRankIndex { get; set; }
    public int? ToRankIndex { get; set; }
}
