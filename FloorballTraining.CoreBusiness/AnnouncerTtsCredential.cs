namespace FloorballTraining.CoreBusiness;

/// <summary>
/// A user's own Azure AI Speech credential for the Hlasatel (announcer) external voice. One per
/// user. The key is stored encrypted (ASP.NET DataProtection, same protector as the AI
/// credentials); only the last four characters are kept in plaintext for masked display. It never
/// leaves the server — the announcer page calls our <c>/announcer/tts/speak</c> proxy, not Azure
/// directly. The browser Web Speech voice keeps working with no key; this is the opt-in premium path.
/// </summary>
public class AnnouncerTtsCredential : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    /// <summary>Azure region id, e.g. "westeurope" — part of the request host.</summary>
    public string Region { get; set; } = string.Empty;

    /// <summary>DataProtection-encrypted Azure Speech resource key. Never returned by the API.</summary>
    public string EncryptedApiKey { get; set; } = string.Empty;

    /// <summary>Last 4 characters of the key, for masked display without decryption.</summary>
    public string KeyLast4 { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastValidatedAt { get; set; }
}
