using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

public class Appointment : BaseEntity
{
    public string Name { get; set; } = null!;
    public DateTime Start { get; set; }
    public int Duration { get; set; }
    public AppointmentType AppointmentType { get; set; }
    public int? TeamId { get; set; }
    public Team? Team { get; set; }
    public int? TrainingId { get; set; }
    public Training? Training { get; set; }

    public Appointment Clone()
    {
        return new Appointment
        {
            Id = Id,
            Name = Name,
            AppointmentType = AppointmentType,
            Start = Start,
            Duration = Duration,
            TeamId = TeamId,
            Team = Team,
            TrainingId = TrainingId,
            Training = Training
        };
    }

    public void Merge(Appointment e)
    {
        Name = e.Name;
        AppointmentType = e.AppointmentType;
        Start = e.Start;
        Duration = e.Duration;
        TeamId = e.TeamId;
        Team = e.Team;
        TrainingId = e.TrainingId;
        Training = e.Training;
    }
}