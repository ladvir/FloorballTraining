using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class RepeatingPattern : BaseEntity
{
    public RepeatingFrequency RepeatingFrequency { get; set; }
    public int Interval { get; set; } // e.g., every 2 days/weeks/months, etc.
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; } // Optional end date for the repeating pattern

    public Appointment InitialAppointment { get; set; } = null!;
    public int InitialAppointmentId { get; set; }
}