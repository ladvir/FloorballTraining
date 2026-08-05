using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A real-world reward (#105) a club or team defines (patch, free camp day…). Unlike badges (#97, fixed
/// in code), rewards are configured per club → they live in the DB. The system marks a member's
/// <b>eligibility</b> (<see cref="MemberRewardClaim"/>); the club physically hands the reward over.
///
/// Club-wide when <see cref="TeamId"/> is null (every player in the club can earn it); a team extension
/// when set (only that team's players). So a team simply <i>adds</i> to the club's reward set.
/// </summary>
public class ClubReward : BaseEntity
{
    public int ClubId { get; set; }
    public Club? Club { get; set; }

    /// <summary>Null = club-wide reward; set = team-scoped extension (only that team's players qualify).</summary>
    public int? TeamId { get; set; }
    public Team? Team { get; set; }

    public string Name { get; set; } = "";
    public string? Description { get; set; }

    public RewardTriggerType TriggerType { get; set; }

    /// <summary>Rank index (RankReached) / <see cref="BadgeCode"/> name (BadgeEarned) / XP threshold (XpThreshold).</summary>
    public string TriggerValue { get; set; } = "";

    public bool IsActive { get; set; } = true;
}
