namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>Player available to the current user — GET /playerskills/roster.</summary>
public class PlayerSkillRosterMemberDto
{
    public int MemberId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    /// <summary>Enums.SkillCategoryPosition name ("FieldPlayer"/"Goalkeeper").</summary>
    public string Position { get; set; } = string.Empty;
    public List<string> Teams { get; set; } = [];
}

/// <summary>Player skill card (spec section 9) — GET /playerskills/member/{id}.</summary>
public class PlayerSkillCardDto
{
    public int MemberId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    /// <summary>Enums.SkillCategoryPosition name ("FieldPlayer"/"Goalkeeper").</summary>
    public string Position { get; set; } = string.Empty;
    public List<PlayerSkillCategoryDto> Categories { get; set; } = [];
}

public class PlayerSkillCategoryDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
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
