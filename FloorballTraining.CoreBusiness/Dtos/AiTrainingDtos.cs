namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>Coach's parameters for AI training generation (POST /ai/training-draft).</summary>
public class TrainingGenerationRequest
{
    public int ClubId { get; set; }
    public List<int> GoalTagIds { get; set; } = [];
    public int AgeGroupId { get; set; }
    public int DurationMinutes { get; set; }
    public int PersonsMin { get; set; }
    public int PersonsMax { get; set; }
    public List<int>? EquipmentIds { get; set; }
    /// <summary>1–10, optional.</summary>
    public int? Intensity { get; set; }
    public string? Notes { get; set; }
    /// <summary>Explicit credential override — must be one of the caller's OWN credentials.</summary>
    public int? CredentialId { get; set; }
}

/// <summary>AI-generated training draft. Activity ids are validated server-side
/// against the candidate set — the draft never references a non-existent activity.</summary>
public class TrainingDraftDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Duration { get; set; }
    public int PersonsMin { get; set; }
    public int PersonsMax { get; set; }
    public int? Intensity { get; set; }
    public int AgeGroupId { get; set; }
    public List<int> GoalTagIds { get; set; } = [];
    public List<TrainingDraftPartDto> Parts { get; set; } = [];
}

public class TrainingDraftPartDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Duration { get; set; }
    public List<TrainingDraftActivityDto> Activities { get; set; } = [];
}

public class TrainingDraftActivityDto
{
    public int ActivityId { get; set; }
    public string ActivityName { get; set; } = string.Empty;
}

/// <summary>Machine-readable validation warning; the client localizes by code.</summary>
public class AiDraftWarningDto
{
    public string Code { get; set; } = string.Empty;
    public string? Value { get; set; }
}

public class AiUsageDto
{
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
}

/// <summary>Payload of the final SSE `result` event of /ai/training-draft.</summary>
public class TrainingDraftResultDto
{
    public TrainingDraftDto Draft { get; set; } = new();
    public AiUsageDto Usage { get; set; } = new();
    public List<AiDraftWarningDto> Warnings { get; set; } = [];
}

// ── Draft part/activity regeneration (etapa #77) ─────────────────────────────

/// <summary>POST /ai/training-draft/regenerate — redo one part or swap one activity.</summary>
public class RegeneratePartRequest
{
    /// <summary>The original generation parameters (club, goals, age group, ...).</summary>
    public TrainingGenerationRequest Request { get; set; } = new();
    /// <summary>The current draft — untouched parts are kept as context.</summary>
    public TrainingDraftDto Draft { get; set; } = new();
    public int PartIndex { get; set; }
    /// <summary>Null = regenerate the whole part; a value = replace just that activity.</summary>
    public int? ReplaceActivityId { get; set; }
}

public class RegeneratePartResultDto
{
    public TrainingDraftPartDto Part { get; set; } = new();
    public AiUsageDto Usage { get; set; } = new();
    public List<AiDraftWarningDto> Warnings { get; set; } = [];
}

// ── Player report AI recommendations (Feat15 #48) ────────────────────────────

/// <summary>One AI development recommendation with concrete library activities.</summary>
public class AiRecommendationDto
{
    public string Title { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public List<TrainingDraftActivityDto> Activities { get; set; } = [];
}

/// <summary>Response of POST /members/{id}/report/recommendations.</summary>
public class AiRecommendationsResultDto
{
    public List<AiRecommendationDto> Recommendations { get; set; } = [];
    public AiUsageDto Usage { get; set; } = new();
    public List<AiDraftWarningDto> Warnings { get; set; } = [];
}
