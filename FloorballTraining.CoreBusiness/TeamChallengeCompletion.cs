namespace FloorballTraining.CoreBusiness;

/// <summary>
/// One rostered player's slice of a completed <see cref="TeamChallenge"/> within one window (#156).
/// Mirrors <see cref="ChallengeCompletion"/>: one row per (TeamChallengeId, MemberId, PeriodKey) so the
/// derived bonus <see cref="XpEvent"/> keeps a unique (Type, SourceKind, SourceId=this.Id) key. "The team
/// completed the challenge in window X" = at least one row exists for (TeamChallengeId, PeriodKey).
///
/// Written by <c>TeamChallengeService</c> for a derived challenge (<see cref="CompletedByUserId"/> null),
/// or by the coach's manual toggle (<see cref="CompletedByUserId"/> set). Feeds a bonus
/// <see cref="XpEvent"/> (Type=TeamChallengeReward, SourceKind=TeamChallenge) through the existing ledger.
/// </summary>
public class TeamChallengeCompletion : BaseEntity
{
    public int TeamChallengeId { get; set; }
    public TeamChallenge? TeamChallenge { get; set; }

    public int MemberId { get; set; }
    public Member? Member { get; set; }

    /// <summary>Window identifier: "2026-W31" (week), "2026-M08" (month), "S{seasonId}" (season)
    /// or "C{challengeId}" (custom range — one completion for the whole range).</summary>
    public string PeriodKey { get; set; } = null!;

    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Null = derived by the recompute; set = the coach who marked a manual challenge done.</summary>
    public string? CompletedByUserId { get; set; }
}
