using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Training block (2-6 weeks) within a team's season plan. The season phase
/// (preparation/competition/...) is an attribute, not a separate entity.
/// Dates are date-only (midnight), both inclusive.
/// </summary>
public class Mesocycle : BaseEntity, IAuditable
{
    public int TeamId { get; set; }
    public Team? Team { get; set; }

    public string Name { get; set; } = string.Empty;
    public MesocyclePhase Phase { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Goal { get; set; }

    public List<Microcycle> Microcycles { get; set; } = [];
    public List<MesocycleTag> GoalTags { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
