namespace FloorballTraining.CoreBusiness;

public class AppointmentAttendance : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public int MemberId { get; set; }
    public Member? Member { get; set; }

    /// <summary>0=Unknown, 1=Present, 2=Absent, 3=Excused</summary>
    public int Status { get; set; }

    public string? Note { get; set; }

    public string? RecordedByUserId { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}
