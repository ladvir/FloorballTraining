namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>A player's self-reported home training (#104) as returned to clients.</summary>
public class HomeTrainingLogDto
{
    public int Id { get; set; }
    public int MemberId { get; set; }
    public string? MemberName { get; set; }
    public int? TrainingId { get; set; }
    public string Title { get; set; } = "";
    public int? DurationMin { get; set; }
    public string? Note { get; set; }
    public DateTime LoggedAt { get; set; }

    /// <summary>"Pending" | "Confirmed" | "Rejected".</summary>
    public string Status { get; set; } = "Pending";
    public string? ConfirmedByUserId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public int? AppointmentId { get; set; }
}

/// <summary>Player self-log payload. Either <see cref="TrainingId"/> (a home/individual training) or a free-text <see cref="Title"/>.</summary>
public class CreateHomeTrainingLogDto
{
    public int? TrainingId { get; set; }
    public string? Title { get; set; }
    public int? DurationMin { get; set; }
    public string? Note { get; set; }
    /// <summary>The day the player trained; the server normalises it to a date (1 log/day).</summary>
    public DateTime LoggedAt { get; set; }
}
