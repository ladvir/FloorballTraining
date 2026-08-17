namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>Explicit, coach-editable player role (issue #91) — primary source of truth for which
/// skill categories a member's card shows. "Both" surfaces categories for FieldPlayer and
/// Goalkeeper together; unset (no MemberPlayerRole row) falls back to lineup inference.</summary>
public enum MemberSkillPosition
{
    FieldPlayer = 0,
    Goalkeeper = 1,
    Both = 2
}
