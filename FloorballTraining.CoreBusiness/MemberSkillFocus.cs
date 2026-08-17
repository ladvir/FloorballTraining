namespace FloorballTraining.CoreBusiness;

/// <summary>A skill the coach picked as a development focus for a member ("Doporučení pro
/// rozvoj") — separate flag table like MemberPlayerRole, keyed (MemberId, SkillId); a missing
/// row simply means "not selected". Independent of the insert-only rating history.</summary>
public class MemberSkillFocus
{
    public int MemberId { get; set; }

    public int SkillId { get; set; }
}
