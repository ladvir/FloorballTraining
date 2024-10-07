using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class Appointment : BaseEntity
{
    public string? Name { get; set; }
    public string? Description { get; set; }

    public DateTime Start { get; set; }
    public DateTime End { get; set; }

    public AppointmentType AppointmentType { get; set; }

    public RepeatingPattern? RepeatingPattern { get; set; }
    public int? RepeatingPatternId { get; set; } // Nullable to indicate if it's a repeating appointment


    public bool IsPast => Start < DateTime.UtcNow;

    public int LocationId { get; set; }
    public Place? Location { get; set; }

    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public int? ParentAppointmentId { get; set; }
    public Appointment? ParentAppointment { get; set; } // Reference to parent appointment if this is a future one
    public List<Appointment> FutureAppointments { get; set; } = [];

    public int? TrainingId { get; set; }
    public Training? Training { get; set; }

    public Appointment Clone()
    {
        return new Appointment
        {
            Id = Id,
            Name = Name,
            Description = Description,
            AppointmentType = AppointmentType,
            Start = Start,
            End = End,
            //RepeatingPatternId = RepeatingPatternId,
            //RepeatingPattern = RepeatingPattern,
            Location = Location,
            LocationId = LocationId,
            TeamId = TeamId,
            Team = Team,
            TrainingId = TrainingId,
            Training = Training,
            ParentAppointment = ParentAppointment,
            FutureAppointments = FutureAppointments
        };
    }

    public void Merge(Appointment e)
    {
        Name = e.Name;
        Description = e.Description;
        AppointmentType = e.AppointmentType;
        Start = e.Start;
        End = e.End;
        RepeatingPatternId = e.RepeatingPatternId;
        RepeatingPattern = e.RepeatingPattern;
        Location = e.Location;
        LocationId = e.LocationId;
        TeamId = e.TeamId;
        Team = e.Team;
        TrainingId = e.TrainingId;
        Training = e.Training;
        ParentAppointment = e.ParentAppointment;
        FutureAppointments = e.FutureAppointments;
    }
}