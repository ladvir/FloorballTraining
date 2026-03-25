using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class AppointmentRating : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public string UserId { get; set; } = string.Empty;

    public int Grade { get; set; } // 1-5 (1 = best, 5 = worst)

    public string? Comment { get; set; }

    public RaterType RaterType { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
