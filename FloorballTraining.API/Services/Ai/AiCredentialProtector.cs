using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;

namespace FloorballTraining.API.Services.Ai;

public interface IAiCredentialProtector
{
    string Protect(string apiKey);

    /// <summary>
    /// Decrypts a stored key. Returns null when the payload cannot be decrypted
    /// (lost key ring, tampered value) — callers surface this as "re-enter your key",
    /// never as a 500.
    /// </summary>
    string? TryUnprotect(string encryptedApiKey);
}

public class AiCredentialProtector : IAiCredentialProtector
{
    // Versioned purpose string: changing it invalidates every stored key on purpose.
    private const string Purpose = "FloTr.AiCredentials.v1";

    private readonly IDataProtector _protector;

    public AiCredentialProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector(Purpose);
    }

    public string Protect(string apiKey) => _protector.Protect(apiKey);

    public string? TryUnprotect(string encryptedApiKey)
    {
        try
        {
            return _protector.Unprotect(encryptedApiKey);
        }
        catch (CryptographicException)
        {
            return null;
        }
    }
}
