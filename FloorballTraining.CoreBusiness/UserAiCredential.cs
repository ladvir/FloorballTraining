using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A user's own AI subscription (BYOK API key) for one provider. The key is stored
/// encrypted (ASP.NET DataProtection); only the last four characters are kept in
/// plaintext for masking. A user may own any number of credentials but at most one
/// is active — the active one is used for all their AI calls.
/// </summary>
public class UserAiCredential : BaseEntity, IAuditable
{
    public string UserId { get; set; } = string.Empty;

    /// <summary>Display name chosen by the owner, unique per user.</summary>
    public string Name { get; set; } = string.Empty;

    public AiProvider Provider { get; set; }

    /// <summary>DataProtection-encrypted API key. Never returned by the API.</summary>
    public string EncryptedApiKey { get; set; } = string.Empty;

    /// <summary>Last 4 characters of the key, for masked display without decryption.</summary>
    public string KeyLast4 { get; set; } = string.Empty;

    /// <summary>Preferred model id (free text); null = provider default suggested by the client.</summary>
    public string? Model { get; set; }

    public bool IsActive { get; set; }

    public DateTime? LastValidatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }

    public List<AiCredentialConsent> Consents { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByUserId { get; set; }
    public string? UpdatedByUserId { get; set; }
}
