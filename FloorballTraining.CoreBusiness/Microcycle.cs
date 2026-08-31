using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Short training unit (typically one week) inside a mesocycle. Its date range
/// must lie fully within the parent mesocycle. Dates are date-only, inclusive.
/// </summary>
public class Microcycle : BaseEntity, IAuditable
{
    public int MesocycleId { get; set; }
    public Mesocycle? Mesocycle { get; set; }

    public string Name { get; set; } = string.Empty;
    public MicrocycleType Type { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Goal { get; set; }

    // Cílové dovednosti cyklu (max 3) — nahrazuje dřívější MicrocycleTag, sjednoceno s Training (#163).
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
