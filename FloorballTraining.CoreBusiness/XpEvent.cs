using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Append-only XP ledger (layer A). One row per rewarded source record — never updated.
/// Idempotence key: (Type, SourceKind, SourceId); the source id always identifies a single
/// member's record, so member is implied. XP is derived from coach-entered data only (anti-cheat).
/// </summary>
public class XpEvent : BaseEntity
{
    public int MemberId { get; set; }
    public Member? Member { get; set; }

    public XpEventType Type { get; set; }

    /// <summary>May be negative (e.g. a minus event feeding PlusMinus).</summary>
    public int Points { get; set; }

    public int? SeasonId { get; set; }
    public Season? Season { get; set; }

    public XpSourceKind SourceKind { get; set; }

    /// <summary>Id of the source record within <see cref="SourceKind"/> — the idempotence anchor.</summary>
    public int? SourceId { get; set; }

    public DateTime OccurredAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
