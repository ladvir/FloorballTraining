using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Metering record of a single AI call — metadata only (who, where, which feature,
/// provider/model, token counts, duration, outcome). Prompt and response content is
/// never stored (GDPR). Source rows for the per-club/user/team usage analytics.
/// </summary>
public class AiUsageLog : BaseEntity, IAuditable
{
    public string UserId { get; set; } = string.Empty;
    public int? ClubId { get; set; }
    public int? TeamId { get; set; }
    public int? MemberId { get; set; }

    public AiFeature Feature { get; set; }
    public AiProvider Provider { get; set; }
    public string Model { get; set; } = string.Empty;

    /// <summary>Credential used; SetNull on credential deletion so history survives.</summary>
    public int? CredentialId { get; set; }
    public AiCredentialSource CredentialSource { get; set; }

    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int DurationMs { get; set; }

    public bool Success { get; set; }
    public string? ErrorType { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
