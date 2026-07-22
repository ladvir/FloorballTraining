namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>Player available to the current user — GET /playerskills/roster.</summary>
public class PlayerSkillRosterMemberDto
{
    public int MemberId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    /// <summary>Enums.SkillCategoryPosition name ("FieldPlayer"/"Goalkeeper").</summary>
    public string Position { get; set; } = string.Empty;
    public int BirthYear { get; set; }
    public List<string> Teams { get; set; } = [];
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
}

/// <summary>One historical rating entry — GET /playerskills/member/{id}/skill/{skillId}/history.</summary>
public class PlayerSkillHistoryEntryDto
{
    public int Grade { get; set; }
    public int? TargetGrade { get; set; }
    public string? Recommendation { get; set; }
    public DateTime RatedAt { get; set; }
    public string? RatedByUserName { get; set; }
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
