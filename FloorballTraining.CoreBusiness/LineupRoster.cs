namespace FloorballTraining.CoreBusiness;

public class LineupRoster : BaseEntity
{
    public int MatchLineupId { get; set; }
    public MatchLineup? MatchLineup { get; set; }

    public int? MemberId { get; set; }
    public Member? Member { get; set; }

    /// <summary>Free-text name when player is a guest without a Member record.</summary>
    public string? ManualName { get; set; }

    public bool IsAvailable { get; set; } = true;

    public int SortOrder { get; set; }
}
