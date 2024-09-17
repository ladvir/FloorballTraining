using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class RepeatingPatternDto : BaseEntityDto
{
    public RepeatingFrequency RepeatingFrequency { get; set; } = RepeatingFrequency.Once;
    public int Interval { get; set; } // e.g., every 2 days/weeks/months, etc.
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; } // Optional end date for the repeating pattern
    public List<AppointmentDto> FutureAppointments { get; set; } = [];

    public AppointmentDto InitialAppointment { get; set; } = null!;
}