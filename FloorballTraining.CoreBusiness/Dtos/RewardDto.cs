namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>A reward definition (#105) plus whether the caller may edit it (drives UI gating vs. an explanatory banner).</summary>
public class ClubRewardDto
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public int? TeamId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string TriggerType { get; set; } = "";
    public string TriggerValue { get; set; } = "";
    public bool IsActive { get; set; }
    /// <summary>Number of members who have earned this reward (audit at a glance).</summary>
    public int ClaimCount { get; set; }
    /// <summary>True if the caller's role lets them edit/delete this reward.</summary>
    public bool CanManage { get; set; }
}

/// <summary>Reward list for a club/team scope, plus whether the caller may add rewards here.</summary>
public class RewardListDto
{
    /// <summary>True if the caller may create rewards in this scope; false → the UI shows why not.</summary>
    public bool CanManage { get; set; }
    public List<ClubRewardDto> Rewards { get; set; } = [];
}

public class SaveClubRewardDto
{
    public int ClubId { get; set; }
    public int? TeamId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string TriggerType { get; set; } = "";
    public string TriggerValue { get; set; } = "";
    public bool IsActive { get; set; } = true;
}

/// <summary>A granted reward: who earned what, when, and (once handed over) by whom. #105 audit.</summary>
public class MemberRewardClaimDto
{
    public int Id { get; set; }
    public int MemberId { get; set; }
    public string MemberName { get; set; } = "";
    public int ClubRewardId { get; set; }
    public string RewardName { get; set; } = "";
    public string? RewardDescription { get; set; }
    public int? TeamId { get; set; }
    public DateTime EarnedAt { get; set; }
    public string Status { get; set; } = "";
    public string? FulfilledByUserId { get; set; }
    public string? FulfilledByName { get; set; }
    public DateTime? FulfilledAt { get; set; }
    /// <summary>True if the caller may mark this claim fulfilled.</summary>
    public bool CanFulfill { get; set; }
}
