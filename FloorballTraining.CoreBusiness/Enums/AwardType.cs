namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>A coach's 1-click bonus kind (layer B, #100). Stored as int.</summary>
public enum AwardType
{
    /// <summary>Best player of a training — max one per appointment.</summary>
    PlayerOfTraining,
    /// <summary>Fair play / helping / captaincy — training or match.</summary>
    FairPlay,
    /// <summary>The player's family came to cheer — match only.</summary>
    FamilyCheered
}
