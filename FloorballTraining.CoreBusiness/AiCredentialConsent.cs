using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// Owner's consent for their AI credential to be used by others. A credential is
/// strictly personal unless a consent row exists: Club scope makes it eligible as
/// that club's default key, Global scope as the admin-defined global default.
/// Consents are revocable at any time and are re-checked on every AI call.
/// </summary>
public class AiCredentialConsent : BaseEntity, IAuditable
{
    public int CredentialId { get; set; }
    public UserAiCredential? Credential { get; set; }

    public AiConsentScope Scope { get; set; }

    /// <summary>Target club for Club scope; null for Global scope.</summary>
    public int? GrantedToClubId { get; set; }
    public Club? GrantedToClub { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
