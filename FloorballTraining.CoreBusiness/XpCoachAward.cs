using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Layer B (#100): a coach's 1-click bonus. The record itself IS the approval — no extra flow.
/// XP is then derived from it exactly like <see cref="XpEvent"/> (idempotent via SourceKind=CoachAward,
/// SourceId=this.Id). Anti-abuse is enforced by unique indexes (see XpCoachAwardConfiguration).
/// </summary>
public class XpCoachAward : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public int MemberId { get; set; }
    public Member? Member { get; set; }

    public AwardType Type { get; set; }

    public string AwardedByUserId { get; set; } = "";
    public DateTime AwardedAt { get; set; } = DateTime.UtcNow;
}
