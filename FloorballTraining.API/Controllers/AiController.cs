using System.Diagnostics;
using System.Security.Claims;
using System.Text.Json;
using FloorballTraining.API.Authorization;
using FloorballTraining.API.Extensions;
using FloorballTraining.API.Services;
using FloorballTraining.API.Services.Ai;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// AI training generation (Feat12 #45, etapa #71). Streams the draft as SSE over an
/// authenticated POST: `status` → `delta {text}` → `result {draft, usage, warnings}`
/// or `error {code}`. Pre-stream failures (AI disabled, no credential) return regular
/// HTTP errors with a machine-readable code.
/// </summary>
[Authorize(Policy = Policies.MinCoach)]
public class AiController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    IAiCredentialResolver credentialResolver,
    IAiCredentialProtector protector,
    IAiClientFactory aiClientFactory,
    IAiUsageLogger usageLogger,
    IConfiguration configuration,
    ILogger<AiController> logger) : BaseApiController
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin");

    [HttpPost("training-draft")]
    [EnableRateLimiting(RateLimitingExtensions.AiPolicy)]
    public async Task<IActionResult> GenerateTrainingDraft(
        TrainingGenerationRequest request, CancellationToken cancellationToken)
    {
        // The club drives which default key may be used — the caller must belong to it.
        if (!IsAdmin())
        {
            var memberships = await clubRoleService.GetAllUserClubRolesAsync(CurrentUserId);
            if (memberships.All(m => m.ClubId != request.ClubId))
                return Forbid();
        }

        var resolved = await ResolveCredentialAsync(request, cancellationToken);
        if (resolved.Result != null) return resolved.Result;
        var credential = resolved.Credential!;

        var candidates = await TrainingPromptBuilder.SelectCandidatesAsync(context, request, cancellationToken);
        if (candidates.Count == 0)
            return BadRequest(new { code = "noActivities", message = "No activities match the request." });

        var goalTagNames = await context.Tags
            .Where(t => request.GoalTagIds.Contains(t.Id))
            .Select(t => t.Name)
            .ToListAsync(cancellationToken);
        var ageGroupName = await context.AgeGroups
            .Where(g => g.Id == request.AgeGroupId)
            .Select(g => g.Description)
            .FirstOrDefaultAsync(cancellationToken) ?? "";
        var equipmentNames = request.EquipmentIds is { Count: > 0 }
            ? await context.Equipments
                .Where(e => request.EquipmentIds.Contains(e.Id))
                .Select(e => e.Name)
                .ToListAsync(cancellationToken)
            : [];

        var chatRequest = new AiChatRequest(
            TrainingPromptBuilder.BuildSystemPrompt(),
            TrainingPromptBuilder.BuildUserPrompt(request, candidates, goalTagNames, ageGroupName, equipmentNames),
            credential.Model,
            MaxTokens: 8000);

        // From here on the response is an SSE stream — errors become `error` events.
        Response.Headers.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        // Proxies (nginx-style) must not buffer the stream either.
        Response.Headers["X-Accel-Buffering"] = "no";
        HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

        var stopwatch = Stopwatch.StartNew();
        var inputTokens = 0;
        var outputTokens = 0;
        var success = false;
        string? errorType = null;

        try
        {
            await WriteEventAsync("status", new { message = "generating" }, cancellationToken);

            var text = new System.Text.StringBuilder();
            var client = aiClientFactory.Create(credential.Provider, credential.ApiKey);
            await foreach (var streamEvent in client.StreamAsync(chatRequest, cancellationToken))
            {
                switch (streamEvent)
                {
                    case AiTextDelta delta:
                        text.Append(delta.Text);
                        await WriteEventAsync("delta", new { text = delta.Text }, cancellationToken);
                        break;
                    case AiUsageEvent usage:
                        inputTokens = Math.Max(inputTokens, usage.InputTokens);
                        outputTokens = Math.Max(outputTokens, usage.OutputTokens);
                        break;
                }
            }

            var (draft, warnings, error) = TrainingPromptBuilder.ParseAndValidate(text.ToString(), request, candidates);
            if (draft == null)
            {
                errorType = error ?? "parseFailed";
                await WriteEventAsync("error", new { code = errorType }, cancellationToken);
            }
            else
            {
                success = true;
                await WriteEventAsync("result", new TrainingDraftResultDto
                {
                    Draft = draft,
                    Usage = new AiUsageDto { InputTokens = inputTokens, OutputTokens = outputTokens },
                    Warnings = warnings
                }, cancellationToken);
            }
        }
        catch (AiProviderException ex)
        {
            errorType = ex.ErrorType;
            logger.LogWarning(ex, "AI provider error during training generation");
            // Provider error bodies carry no prompt content — pass the detail through
            // so the coach sees WHY (e.g. which Gemini quota) without reading API logs.
            await TryWriteErrorAsync(ex.ErrorType, cancellationToken, ex.Message);
        }
        catch (OperationCanceledException)
        {
            errorType = "cancelled";
        }
        catch (Exception ex)
        {
            errorType = "unexpected";
            logger.LogError(ex, "Unexpected error during AI training generation");
            await TryWriteErrorAsync("unexpected", cancellationToken);
        }
        finally
        {
            stopwatch.Stop();
            await usageLogger.LogAsync(new AiUsageEntry(
                CurrentUserId,
                request.ClubId,
                TeamId: null,
                MemberId: null,
                AiFeature.TrainingGeneration,
                credential.Provider,
                credential.Model,
                credential.CredentialId,
                credential.Source,
                inputTokens,
                outputTokens,
                (int)stopwatch.ElapsedMilliseconds,
                success,
                errorType));
        }

        return new EmptyResult();
    }

    /// <summary>
    /// Explicit credentialId → strictly the caller's OWN credential (no consent bypass);
    /// otherwise the standard pipeline (own active → club default → global default).
    /// </summary>
    private async Task<(ResolvedAiCredential? Credential, IActionResult? Result)> ResolveCredentialAsync(
        TrainingGenerationRequest request, CancellationToken cancellationToken)
    {
        if (request.CredentialId.HasValue)
        {
            // Even the owner may only use an explicit credential when AI is on for the club.
            var pipeline = await credentialResolver.ResolveAsync(CurrentUserId, request.ClubId, cancellationToken);
            if (pipeline.Error == AiResolutionError.AiDisabled)
                return (null, StatusCode(StatusCodes.Status403Forbidden, new { code = "aiDisabled" }));

            var own = await context.UserAiCredentials.FirstOrDefaultAsync(
                c => c.Id == request.CredentialId.Value && c.UserId == CurrentUserId, cancellationToken);
            if (own == null)
                return (null, NotFound(new { code = "credentialNotFound" }));

            var apiKey = protector.TryUnprotect(own.EncryptedApiKey);
            if (apiKey == null)
                return (null, BadRequest(new { code = "credentialNeedsReentry" }));

            return (new ResolvedAiCredential(
                own.Id, own.Provider, apiKey,
                own.Model ?? AiCredentialResolver.DefaultModelFor(own.Provider, configuration),
                AiCredentialSource.Own, own.UserId), null);
        }

        var resolved = await credentialResolver.ResolveAsync(CurrentUserId, request.ClubId, cancellationToken);
        return resolved.Error switch
        {
            AiResolutionError.AiDisabled =>
                (null, StatusCode(StatusCodes.Status403Forbidden, new { code = "aiDisabled" })),
            AiResolutionError.NoCredential =>
                (null, BadRequest(new { code = "noCredential" })),
            AiResolutionError.DecryptFailed =>
                (null, BadRequest(new { code = "credentialNeedsReentry" })),
            _ => (resolved.Credential, null)
        };
    }

    private async Task WriteEventAsync(string eventName, object payload, CancellationToken cancellationToken)
    {
        await Response.WriteAsync($"event: {eventName}\n", cancellationToken);
        await Response.WriteAsync($"data: {JsonSerializer.Serialize(payload, Json)}\n\n", cancellationToken);
        await Response.Body.FlushAsync(cancellationToken);
    }

    private async Task TryWriteErrorAsync(string code, CancellationToken cancellationToken, string? message = null)
    {
        try
        {
            await WriteEventAsync("error", new { code, message }, cancellationToken);
        }
        catch
        {
            // Client already gone — nothing to report to.
        }
    }
}
