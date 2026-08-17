using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness.Dtos;

/// <summary>AI usage analytics per club/user/team (Feat12 #45, etapa #76).</summary>
public class AiUsageSummaryDto
{
    public AiUsageTotalsDto Totals { get; set; } = new();
    public List<AiUsageByDayDto> ByDay { get; set; } = [];
    public List<AiUsageByFeatureDto> ByFeature { get; set; } = [];
    public List<AiUsageByProviderDto> ByProvider { get; set; } = [];
    /// <summary>Top 10 users by call count.</summary>
    public List<AiUsageByUserDto> ByUser { get; set; } = [];
    public List<AiUsageByTeamDto> ByTeam { get; set; } = [];
}

public class AiUsageTotalsDto
{
    public int Calls { get; set; }
    public long InputTokens { get; set; }
    public long OutputTokens { get; set; }
    public double ErrorRatePct { get; set; }
    public double AvgDurationMs { get; set; }
}

public class AiUsageByDayDto
{
    /// <summary>yyyy-MM-dd</summary>
    public string Date { get; set; } = string.Empty;
    public int Calls { get; set; }
    public long InputTokens { get; set; }
    public long OutputTokens { get; set; }
    public AiFeature Feature { get; set; }
}

public class AiUsageByFeatureDto
{
    public AiFeature Feature { get; set; }
    public int Calls { get; set; }
    public long InputTokens { get; set; }
    public long OutputTokens { get; set; }
}

public class AiUsageByProviderDto
{
    public AiProvider Provider { get; set; }
    public int Calls { get; set; }
    public long InputTokens { get; set; }
    public long OutputTokens { get; set; }
}

public class AiUsageByUserDto
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int Calls { get; set; }
    public long InputTokens { get; set; }
    public long OutputTokens { get; set; }
}

public class AiUsageByTeamDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int Calls { get; set; }
    public long InputTokens { get; set; }
    public long OutputTokens { get; set; }
}

/// <summary>One row of the recent-calls table (metadata only — no content exists).</summary>
public class AiUsageLogDto
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int? ClubId { get; set; }
    public int? TeamId { get; set; }
    public int? MemberId { get; set; }
    public AiFeature Feature { get; set; }
    public AiProvider Provider { get; set; }
    public string Model { get; set; } = string.Empty;
    public AiCredentialSource CredentialSource { get; set; }
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int DurationMs { get; set; }
    public bool Success { get; set; }
    public string? ErrorType { get; set; }
}
