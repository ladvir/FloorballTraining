namespace FloorballTraining.CoreBusiness;

/// <summary>Insert-only history record (like TestResult) — never updated; current grade = latest RatedAt per (MemberId, SkillId).</summary>
public class PlayerSkillRating : BaseEntity
{
    public int MemberId { get; set; }
    public Member? Member { get; set; }

    public int SkillId { get; set; }
    public Skill? Skill { get; set; }

    public int Grade { get; set; } // 1 (best) - 5 (worst)

    public int? TargetGrade { get; set; } // 1 (best) - 5 (worst)

    public string? Recommendation { get; set; }

    public DateTime RatedAt { get; set; } = DateTime.UtcNow;

    public string RatedByAppUserId { get; set; } = string.Empty;
}
