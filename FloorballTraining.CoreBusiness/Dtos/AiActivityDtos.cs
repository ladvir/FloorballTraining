namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>POST /ai/activities/suggest — AI activity import by search criteria (etapa #78).</summary>
public class ActivitySuggestionRequest
{
    public int ClubId { get; set; }
    /// <summary>Free-text search criteria (what the coach is looking for).</summary>
    public string Criteria { get; set; } = string.Empty;
    /// <summary>How many proposals to return (1–3).</summary>
    public int Count { get; set; } = 2;
}

/// <summary>
/// One AI-proposed activity. Tag/age-group/equipment ids reference the app's real
/// catalogs (validated server-side); nothing is saved until the user confirms it
/// in the standard activity form.
/// </summary>
public class ActivitySuggestionDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMin { get; set; }
    public int DurationMax { get; set; }
    public int PersonsMin { get; set; }
    public int PersonsMax { get; set; }
    public List<int> TagIds { get; set; } = [];
    public List<string> TagNames { get; set; } = [];
    public List<int> AgeGroupIds { get; set; } = [];
    public List<string> AgeGroupNames { get; set; } = [];
    public List<int> EquipmentIds { get; set; } = [];
    public List<string> EquipmentNames { get; set; } = [];
}

public class ActivitySuggestionsResultDto
{
    public List<ActivitySuggestionDto> Suggestions { get; set; } = [];
    public AiUsageDto Usage { get; set; } = new();
    public List<AiDraftWarningDto> Warnings { get; set; } = [];
}
