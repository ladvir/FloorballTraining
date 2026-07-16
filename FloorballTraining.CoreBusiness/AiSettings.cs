namespace FloorballTraining.CoreBusiness;

/// <summary>
/// AI enablement and default credential. One row per club plus one global row
/// (ClubId = null) acting as the kill-switch and global default. AI is disabled
/// unless BOTH the global row and the club row are enabled.
/// </summary>
public class AiSettings : BaseEntity, IAuditable
{
    /// <summary>Null = the single global settings row.</summary>
    public int? ClubId { get; set; }
    public Club? Club { get; set; }

    public bool Enabled { get; set; }

    /// <summary>Fallback credential (requires a matching consent, re-checked on every call).</summary>
    public int? DefaultCredentialId { get; set; }
    public UserAiCredential? DefaultCredential { get; set; }

    /// <summary>Optional model override used with the default credential.</summary>
    public string? DefaultModel { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
