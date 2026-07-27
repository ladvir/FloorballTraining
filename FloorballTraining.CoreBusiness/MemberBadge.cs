using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A milestone badge a member has earned (#97). Derived from the same coach-entered records as
/// <see cref="XpEvent"/>, so unfalsifiable. Idempotence key: (MemberId, Code, SeasonId) — SeasonId is null
/// for lifetime badges and set for season-scoped ones (Iron Man), so the same badge can be earned once per season.
/// </summary>
public class MemberBadge : BaseEntity
{
    public int MemberId { get; set; }
    public Member? Member { get; set; }

    public BadgeCode Code { get; set; }

    /// <summary>Set for season-scoped badges (Iron Man); null for lifetime badges.</summary>
    public int? SeasonId { get; set; }
    public Season? Season { get; set; }

    /// <summary>Optional pointer to the record that earned it (e.g. the StatTracker match id for a hattrick).</summary>
    public int? SourceRef { get; set; }

    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
}
