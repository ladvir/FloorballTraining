namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>What earns a real-world reward (#105). Stored as int. TriggerValue is interpreted per type.</summary>
public enum RewardTriggerType
{
    /// <summary>TriggerValue = a rank index from <see cref="XpProgression.Ranks"/>; earned when the member reaches it.</summary>
    RankReached,
    /// <summary>TriggerValue = a <see cref="BadgeCode"/> name; earned when the member has that badge.</summary>
    BadgeEarned,
    /// <summary>TriggerValue = a lifetime-XP threshold; earned when the member's total XP reaches it.</summary>
    XpThreshold
}
