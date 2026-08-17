namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>One badge's status for a member: earned (with date) or in-progress (with 0..1 progress). #97.</summary>
public class BadgeStatusDto
{
    public string Code { get; set; } = "";
    public string Icon { get; set; } = "";
    public int Threshold { get; set; }
    /// <summary>Current value of the badge's metric (season best for Iron Man).</summary>
    public int Current { get; set; }
    public bool Earned { get; set; }
    public DateTime? EarnedAt { get; set; }
    /// <summary>0..1 progress toward the threshold (1.0 when earned).</summary>
    public double Progress { get; set; }
}
