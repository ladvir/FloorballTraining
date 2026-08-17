namespace FloorballTraining.CoreBusiness;

public class MatchLineup : BaseEntity
{
    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public string Name { get; set; } = null!;

    public int FormationTemplateId { get; set; }
    public FormationTemplate? FormationTemplate { get; set; }

    public int FormationCount { get; set; } = 3;

    public bool IsShared { get; set; }

    public string? CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<LineupRoster> Roster { get; set; } = [];
    public List<LineupFormation> Formations { get; set; } = [];
}
