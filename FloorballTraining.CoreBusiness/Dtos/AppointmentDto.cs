using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

public class AppointmentDto : BaseEntityDto
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public AppointmentType AppointmentType { get; set; }

    public int LocationId { get; set; }

    public string? LocationName { get; set; }

    public RepeatingPatternDto? RepeatingPattern { get; set; }

    public AppointmentDto? ParentAppointment { get; set; }

    public List<AppointmentDto> FutureAppointments { get; set; } = [];
    public bool IsPast => Start < DateTime.UtcNow;

    public int TeamId { get; set; }
    public int? TrainingId { get; set; }
    public string? TrainingName { get; set; }


    public double Duration => Math.Round((End - Start).TotalSeconds / 60);
    public string? Name { get; set; }
    public string? Description { get; set; }
}