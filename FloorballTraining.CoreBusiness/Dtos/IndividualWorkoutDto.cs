namespace FloorballTraining.CoreBusiness.Dtos;

public class IndividualWorkoutDto
{
    public int Id { get; set; }
    public int MemberId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>0=Assigned, 1=Completed, 2=Skipped</summary>
    public int Status { get; set; }
    public DateTime? DueDate { get; set; }
    public string AssignedByUserId { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? PlayerNote { get; set; }
    public bool IsTeamWorkout { get; set; }
    public bool IsOverdue => Status == 0 && DueDate.HasValue && DueDate.Value < DateTime.UtcNow;
}

public class IndividualWorkoutCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsTeamWorkout { get; set; }
}

public class BulkWorkoutCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public List<int> MemberIds { get; set; } = [];
}

public class IndividualWorkoutStatusDto
{
    /// <summary>1=Completed, 2=Skipped</summary>
    public int Status { get; set; }
    public string? PlayerNote { get; set; }
}
