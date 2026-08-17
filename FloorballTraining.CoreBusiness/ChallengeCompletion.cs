namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A challenge a member has completed within one window (#108). Derived idempotently by
/// <c>ChallengeService</c> from the same coach-entered records as XP (attendance, goals, tests…), so it is
/// unfalsifiable. Idempotence key: (MemberId, Code, PeriodKey) — one completion per member per challenge
/// per window (e.g. "2026-W31"). The completion then feeds a bonus <see cref="XpEvent"/>
/// (Type=ChallengeReward, SourceKind=Challenge, SourceId=this.Id) through the existing ledger.
/// </summary>
public class ChallengeCompletion : BaseEntity
{
    public int MemberId { get; set; }
    public Member? Member { get; set; }

    /// <summary><see cref="ChallengeCode"/> name.</summary>
    public string Code { get; set; } = null!;

    /// <summary>Window identifier: "2026-W31" (week), "2026-M08" (month) or "S{seasonId}" (season).</summary>
    public string PeriodKey { get; set; } = null!;

    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
