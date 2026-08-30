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

    // Cílové dovednosti cyklu (max 3) — nahrazuje dřívější MesocycleTag, sjednoceno s Training (#163).
    public Skill? GoalSkill1 { get; set; }
    public int? GoalSkill1Id { get; set; }
    public Skill? GoalSkill2 { get; set; }
    public int? GoalSkill2Id { get; set; }
    public Skill? GoalSkill3 { get; set; }
    public int? GoalSkill3Id { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
