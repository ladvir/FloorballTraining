using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Per-club (and optionally per-team) override of an <see cref="XpEventType"/>'s point value (#106).
/// Missing row = fall back to <see cref="XpRules.PointsFor(XpEventType)"/>. Resolution order when pricing
/// a derived <see cref="XpEvent"/> is team → club → default; a team row only makes sense for event types
/// whose source record carries a team (attendance/match/stats/coach awards) — skill/test/home are member
/// level and are priced at club scope only.
/// Mirrors the club/team-scoped config pattern of <see cref="ClubReward"/>.
/// </summary>
public class XpRuleConfig : BaseEntity, IAuditable
{
    public int ClubId { get; set; }
    public Club? Club { get; set; }

    /// <summary>Null = club-wide value; set = override just for this team.</summary>
    public int? TeamId { get; set; }
    public Team? Team { get; set; }

    public XpEventType EventType { get; set; }

    public int Points { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
