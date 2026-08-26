namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>Player available to the current user — GET /playerskills/roster.</summary>
public class PlayerSkillRosterMemberDto
{
    public int MemberId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    /// <summary>Enums.SkillCategoryPosition name ("FieldPlayer"/"Goalkeeper").</summary>
    public string Position { get; set; } = string.Empty;
    /// <summary>"Player" or "PlayerCoach" — mirrors MemberDto's existing TeamRole(isCoach, isPlayer)
    /// concept (does this member also coach a team, per TeamMember.IsCoach). Spec section 15's
    /// roster "role" filter dimension.</summary>
    public string TeamRole { get; set; } = string.Empty;
    public int BirthYear { get; set; }
    public List<string> Teams { get; set; } = [];
    /// <summary>Per-category average of the latest grades — drives the roster row's colored
    /// grade strip in FlotrPlayer. One entry per category applicable to the member's position.</summary>
    public List<RosterCategoryGradeDto> CategoryGrades { get; set; } = [];
}

/// <summary>One category's average grade in the roster list (see PlayerSkillRosterMemberDto.CategoryGrades).</summary>
public class RosterCategoryGradeDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    /// <summary>Enums.SkillCategoryPosition name ("FieldPlayer"/"Goalkeeper") — lets the client split
    /// a "Both" player's strip into one row per position.</summary>
    public string Position { get; set; } = string.Empty;
    /// <summary>Average (1 best–5 worst) of the latest grades of this category's rated skills; null when none rated yet.</summary>
    public double? Average { get; set; }
}

/// <summary>Player skill card (spec section 9) — GET /playerskills/member/{id} and GET /playerskills/me.</summary>
public class PlayerSkillCardDto
{
    public int MemberId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    /// <summary>Effective/resolved position(s): "FieldPlayer"/"Goalkeeper"/"Both" — drives which categories are included.</summary>
    public string Position { get; set; } = string.Empty;
    /// <summary>The explicitly stored MemberSkillPosition ("FieldPlayer"/"Goalkeeper"/"Both"), or null when no
    /// role has been set yet and Position above is only a lineup-inferred fallback.</summary>
    public string? ExplicitRole { get; set; }
    /// <summary>"Player" or "PlayerCoach" — see PlayerSkillRosterMemberDto.TeamRole. Shown in the mobile
    /// "Režim prohlížení" banner alongside club/team/position (spec section 15).</summary>
    public string TeamRole { get; set; } = string.Empty;
    public string ClubName { get; set; } = string.Empty;
    public int BirthYear { get; set; }
    public List<string> Teams { get; set; } = [];
    public List<PlayerSkillCategoryDto> Categories { get; set; } = [];
}

public class PlayerSkillCategoryDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    /// <summary>Enums.SkillCategoryPosition name ("FieldPlayer"/"Goalkeeper") this category belongs to.</summary>
    public string Position { get; set; } = string.Empty;
    public List<PlayerSkillDto> Skills { get; set; } = [];
}

/// <summary>A single skill with its current (latest) rating, if any.</summary>
public class PlayerSkillDto
{
    public int SkillId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    /// <summary>Current grade 1 (best)–5 (worst); null when never rated.</summary>
    public int? Grade { get; set; }
    public int? TargetGrade { get; set; }
    public string? Recommendation { get; set; }
    public DateTime? RatedAt { get; set; }
    public string? RatedByUserName { get; set; }
    /// <summary>Coach-selected development focus ("Doporučení pro rozvoj") — MemberSkillFocus row exists.</summary>
    public bool IsFocus { get; set; }
}

/// <summary>Request body — PUT /playerskills/member/{id}/skill/{skillId}/focus.</summary>
public class UpdateSkillFocusDto
{
    public bool IsFocus { get; set; }
}

/// <summary>One historical rating entry — GET /playerskills/member/{id}/skill/{skillId}/history.</summary>
public class PlayerSkillHistoryEntryDto
{
    public int Grade { get; set; }
    public int? TargetGrade { get; set; }
    public string? Recommendation { get; set; }
    public DateTime RatedAt { get; set; }
    public string? RatedByUserName { get; set; }
    /// <summary>Result value of the source test ("3.45 s", "Ano", ...) when this rating was test-derived (#92); null for a manual rating.</summary>
    public string? TestValueLabel { get; set; }
}

/// <summary>Batch save request — PUT /playerskills/member/{id}. Each item inserts a new history row.</summary>
public class PlayerSkillBatchUpdateDto
{
    public List<PlayerSkillBatchItemDto> Items { get; set; } = [];
}

public class PlayerSkillBatchItemDto
{
    public int SkillId { get; set; }
    public int Grade { get; set; }
    public int? TargetGrade { get; set; }
    public string? Recommendation { get; set; }
}

/// <summary>Request body — PUT /playerskills/member/{id}/role.</summary>
public class UpdateMemberSkillPositionDto
{
    /// <summary>MemberSkillPosition name: "FieldPlayer" | "Goalkeeper" | "Both".</summary>
    public string Position { get; set; } = string.Empty;
}

/// <summary>Flat catalog entry — GET /playerskills/catalog (admin pickers, e.g. linking a test to a skill).</summary>
public class SkillCatalogEntryDto
{
    public int SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    /// <summary>Enums.SkillCategoryPosition name ("FieldPlayer"/"Goalkeeper").</summary>
    public string Position { get; set; } = string.Empty;
}
