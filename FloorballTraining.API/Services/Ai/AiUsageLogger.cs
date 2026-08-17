using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services.Ai;

public record AiUsageEntry(
    string UserId,
    int? ClubId,
    int? TeamId,
    int? MemberId,
    AiFeature Feature,
    AiProvider Provider,
    string Model,
    int? CredentialId,
    AiCredentialSource CredentialSource,
    int InputTokens,
    int OutputTokens,
    int DurationMs,
    bool Success,
    string? ErrorType);

public interface IAiUsageLogger
{
    /// <summary>
    /// Writes one metering row per AI call (success and failure alike). Resilient:
    /// never throws, and uses an isolated short-lived context so the row survives
    /// whatever happens to the calling operation. Metadata only — no prompt content.
    /// </summary>
    Task LogAsync(AiUsageEntry entry);
}

public class AiUsageLogger(
    IDbContextFactory<FloorballTrainingContext> contextFactory,
    ILogger<AiUsageLogger> logger) : IAiUsageLogger
{
    public async Task LogAsync(AiUsageEntry entry)
    {
        try
        {
            await using var context = await contextFactory.CreateDbContextAsync();

            context.AiUsageLogs.Add(new AiUsageLog
            {
                UserId = entry.UserId,
                ClubId = entry.ClubId,
                TeamId = entry.TeamId,
                MemberId = entry.MemberId,
                Feature = entry.Feature,
                Provider = entry.Provider,
                Model = entry.Model,
                CredentialId = entry.CredentialId,
                CredentialSource = entry.CredentialSource,
                InputTokens = entry.InputTokens,
                OutputTokens = entry.OutputTokens,
                DurationMs = entry.DurationMs,
                Success = entry.Success,
                ErrorType = entry.ErrorType,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = entry.UserId
            });

            if (entry.CredentialId.HasValue)
            {
                await context.UserAiCredentials
                    .Where(c => c.Id == entry.CredentialId.Value)
                    .ExecuteUpdateAsync(s => s.SetProperty(c => c.LastUsedAt, DateTime.UtcNow));
            }

            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to write AI usage log for user {UserId}", entry.UserId);
        }
    }
}
