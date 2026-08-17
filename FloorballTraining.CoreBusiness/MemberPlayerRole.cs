using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>Explicit player role for a member (issue #91) — separate 1:1 table keyed by MemberId,
/// isolated from Member's own migration/entity. A missing row means the role is unset.</summary>
public class MemberPlayerRole
{
    public int MemberId { get; set; }

    public MemberSkillPosition Position { get; set; }
}
