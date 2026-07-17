using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services.Ai;

public enum AiResolutionError
{
    /// <summary>AI is switched off globally or for this club.</summary>
    AiDisabled,
    /// <summary>No usable credential in the whole chain (own → club default → global default).</summary>
    NoCredential,
    /// <summary>A credential was found but its key can no longer be decrypted (re-enter needed).</summary>
    DecryptFailed,
}

public record ResolvedAiCredential(
    int CredentialId,
    AiProvider Provider,
    string ApiKey,
    string Model,
    AiCredentialSource Source,
    string OwnerUserId);

public record AiResolutionResult(ResolvedAiCredential? Credential, AiResolutionError? Error)
{
    public static AiResolutionResult Ok(ResolvedAiCredential credential) => new(credential, null);
    public static AiResolutionResult Fail(AiResolutionError error) => new(null, error);
}

public interface IAiCredentialResolver
{
    /// <summary>
    /// Resolves the credential for one AI call: global kill-switch → club enablement →
    /// user's own active credential → club default → global default. Owner consent is
    /// re-verified here on EVERY call, so a revoked consent takes effect immediately.
    /// Never silently falls back to a foreign credential outside this pipeline.
    /// </summary>
    Task<AiResolutionResult> ResolveAsync(string userId, int clubId, CancellationToken cancellationToken = default);
}

public class AiCredentialResolver(
    FloorballTrainingContext context,
    IAiCredentialProtector protector,
    IConfiguration configuration) : IAiCredentialResolver
{
    /// <summary>Last-resort model aliases, overridable via Ai:DefaultModels:{Provider}.</summary>
    public static string DefaultModelFor(AiProvider provider, IConfiguration configuration) =>
        configuration[$"Ai:DefaultModels:{provider}"] ?? provider switch
        {
            AiProvider.Anthropic => "claude-opus-4-8",
            AiProvider.OpenAi => "gpt-4o",
            AiProvider.Gemini => "gemini-2.0-flash",
            _ => throw new ArgumentOutOfRangeException(nameof(provider))
        };

    private string DefaultModel(AiProvider provider) => DefaultModelFor(provider, configuration);

    public async Task<AiResolutionResult> ResolveAsync(string userId, int clubId, CancellationToken cancellationToken = default)
    {
        var globalSettings = await context.AiSettings
            .FirstOrDefaultAsync(s => s.ClubId == null, cancellationToken);
        var clubSettings = await context.AiSettings
            .FirstOrDefaultAsync(s => s.ClubId == clubId, cancellationToken);

        if (!(globalSettings?.Enabled ?? false) || !(clubSettings?.Enabled ?? false))
            return AiResolutionResult.Fail(AiResolutionError.AiDisabled);

        var sawUndecryptable = false;

        // 1) The user's own active credential always wins.
        var own = await context.UserAiCredentials
            .FirstOrDefaultAsync(c => c.UserId == userId && c.IsActive, cancellationToken);
        if (own != null)
        {
            var key = protector.TryUnprotect(own.EncryptedApiKey);
            if (key != null)
                return AiResolutionResult.Ok(new ResolvedAiCredential(
                    own.Id, own.Provider, key, own.Model ?? DefaultModel(own.Provider),
                    AiCredentialSource.Own, own.UserId));
            // Own key unreadable: do NOT silently fall through to someone else's key —
            // the user must fix or remove theirs first.
            return AiResolutionResult.Fail(AiResolutionError.DecryptFailed);
        }

        // 2) Club default — usable only while the owner's Club consent is in place.
        if (clubSettings.DefaultCredentialId.HasValue)
        {
            var clubDefault = await context.UserAiCredentials
                .Include(c => c.Consents)
                .FirstOrDefaultAsync(c => c.Id == clubSettings.DefaultCredentialId.Value, cancellationToken);
            if (clubDefault != null && clubDefault.Consents.Any(s =>
                    s.Scope == AiConsentScope.Club && s.GrantedToClubId == clubId))
            {
                var key = protector.TryUnprotect(clubDefault.EncryptedApiKey);
                if (key != null)
                    return AiResolutionResult.Ok(new ResolvedAiCredential(
                        clubDefault.Id, clubDefault.Provider, key,
                        clubSettings.DefaultModel ?? clubDefault.Model ?? DefaultModel(clubDefault.Provider),
                        AiCredentialSource.ClubDefault, clubDefault.UserId));
                sawUndecryptable = true;
            }
            // Missing/revoked consent falls through silently to the global default.
        }

        // 3) Global default — requires the owner's Global consent.
        if (globalSettings.DefaultCredentialId.HasValue)
        {
            var globalDefault = await context.UserAiCredentials
                .Include(c => c.Consents)
                .FirstOrDefaultAsync(c => c.Id == globalSettings.DefaultCredentialId.Value, cancellationToken);
            if (globalDefault != null && globalDefault.Consents.Any(s => s.Scope == AiConsentScope.Global))
            {
                var key = protector.TryUnprotect(globalDefault.EncryptedApiKey);
                if (key != null)
                    return AiResolutionResult.Ok(new ResolvedAiCredential(
                        globalDefault.Id, globalDefault.Provider, key,
                        globalSettings.DefaultModel ?? globalDefault.Model ?? DefaultModel(globalDefault.Provider),
                        AiCredentialSource.GlobalDefault, globalDefault.UserId));
                sawUndecryptable = true;
            }
        }

        return AiResolutionResult.Fail(
            sawUndecryptable ? AiResolutionError.DecryptFailed : AiResolutionError.NoCredential);
    }
}
