namespace FloorballTraining.CoreBusiness;

public class AppointmentMemberAssignment
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int MemberId { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    public Appointment? Appointment { get; set; }
    public Member? Member { get; set; }
}
