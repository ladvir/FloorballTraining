namespace FloorballTraining.CoreBusiness;

public class IndividualWorkout : BaseEntity
{
    public int MemberId { get; set; }
    public Member? Member { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>0=Assigned, 1=Completed, 2=Skipped</summary>
    public int Status { get; set; }

    public DateTime? DueDate { get; set; }

    public string AssignedByUserId { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public string? PlayerNote { get; set; }

    /// <summary>true when created via bulk team assignment</summary>
    public bool IsTeamWorkout { get; set; }
}
