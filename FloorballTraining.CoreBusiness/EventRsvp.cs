namespace FloorballTraining.CoreBusiness;

public class EventRsvp
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int MemberId { get; set; }
    public int Status { get; set; } // 0=Pending, 1=Yes, 2=No, 3=Maybe
    public DateTime? ConfirmedAt { get; set; }
    public string? Note { get; set; }

    public Appointment? Appointment { get; set; }
    public Member? Member { get; set; }
}
