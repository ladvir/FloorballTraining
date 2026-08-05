namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>Life-cycle of a member's reward claim (#105). Stored as int.</summary>
public enum RewardClaimStatus
{
    /// <summary>Eligibility met; the club has not yet physically handed the reward over.</summary>
    Eligible,
    /// <summary>The reward was physically handed over (marked by a coach).</summary>
    Fulfilled
}
