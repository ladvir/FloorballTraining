using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A member's earned claim to a <see cref="ClubReward"/> (#105). Written once per (member, reward) the
/// first time eligibility is met — idempotent, like a badge (#97). Carries the full "who / when / what"
/// audit: which member earned which reward when, and who handed it over (Fulfilled).
/// </summary>
public class MemberRewardClaim : BaseEntity
{
    public int MemberId { get; set; }
    public Member? Member { get; set; }

    public int ClubRewardId { get; set; }
    public ClubReward? ClubReward { get; set; }

    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;

    public RewardClaimStatus Status { get; set; } = RewardClaimStatus.Eligible;

    /// <summary>AppUser id of the coach who marked the reward as handed over (plain id, not an FK — mirrors <see cref="XpCoachAward.AwardedByUserId"/>).</summary>
    public string? FulfilledByUserId { get; set; }
    public DateTime? FulfilledAt { get; set; }
}
