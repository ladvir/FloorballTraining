using System.Diagnostics;
using System.Security.Claims;
using FloorballTraining.API.Extensions;
using FloorballTraining.API.Services;
using FloorballTraining.API.Services.Ai;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// AI activity import (etapa #78): the coach describes what they are looking for and
/// the AI drafts matching drills; tag/age-group/equipment ids are grounded in the
/// app's catalogs and validated. Nothing is saved here — the user reviews a proposal
/// and stores it via the standard activity form. Plain [Authorize] on purpose:
/// activity creation is open to every signed-in user (see docs/role-permissions.md).
/// </summary>
[Authorize]
[Route("ai/activities")]
public class AiActivitiesController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    IAiCredentialResolver credentialResolver,
    IAiClientFactory aiClientFactory,
    IAiUsageLogger usageLogger,
    ILogger<AiActivitiesController> logger) : BaseApiController
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin");

    [HttpPost("suggest")]
    [EnableRateLimiting(RateLimitingExtensions.AiPolicy)]
    public async Task<ActionResult<ActivitySuggestionsResultDto>> Suggest(
        ActivitySuggestionRequest request, CancellationToken cancellationToken)
    {
        if (!IsAdmin())
        {
            var memberships = await clubRoleService.GetAllUserClubRolesAsync(CurrentUserId);
            if (memberships.All(m => m.ClubId != request.ClubId))
                return Forbid();
        }

        var resolved = await credentialResolver.ResolveAsync(CurrentUserId, request.ClubId, cancellationToken);
        switch (resolved.Error)
        {
            case AiResolutionError.AiDisabled:
                return StatusCode(StatusCodes.Status403Forbidden, new { code = "aiDisabled" });
            case AiResolutionError.NoCredential:
                return BadRequest(new { code = "noCredential" });
            case AiResolutionError.DecryptFailed:
                return BadRequest(new { code = "credentialNeedsReentry" });
        }
        var credential = resolved.Credential!;

        var tags = await context.Tags
            .Select(t => new CatalogItem(t.Id, t.Name))
            .ToListAsync(cancellationToken);
        var ageGroups = await context.AgeGroups
            .Select(g => new CatalogItem(g.Id, g.Description))
            .ToListAsync(cancellationToken);
        var equipment = await context.Equipments
            .Select(e => new CatalogItem(e.Id, e.Name))
            .ToListAsync(cancellationToken);

        var chatRequest = new AiChatRequest(
            request.UseWebSearch
                ? ActivitySuggestionPromptBuilder.BuildWebSearchSystemPrompt()
                : ActivitySuggestionPromptBuilder.BuildSystemPrompt(),
            ActivitySuggestionPromptBuilder.BuildUserPrompt(request, tags, ageGroups, equipment),
            credential.Model,
            MaxTokens: 6000);

        var stopwatch = Stopwatch.StartNew();
        var inputTokens = 0;
        var outputTokens = 0;
        var success = false;
        string? errorType = null;
        try
        {
            var client = aiClientFactory.Create(credential.Provider, credential.ApiKey);
            var completion = request.UseWebSearch
                ? await client.CompleteWithWebSearchAsync(chatRequest, cancellationToken)
                : await client.CompleteAsync(chatRequest, cancellationToken);
            inputTokens = completion.InputTokens;
            outputTokens = completion.OutputTokens;

            var (suggestions, warnings, error) = ActivitySuggestionPromptBuilder.ParseAndValidate(
                completion.Text, tags, ageGroups, equipment);
            if (suggestions == null)
            {
                errorType = error ?? "parseFailed";
                return BadRequest(new { code = errorType });
            }

            success = true;
            return new ActivitySuggestionsResultDto
            {
                Suggestions = suggestions,
                Usage = new AiUsageDto { InputTokens = inputTokens, OutputTokens = outputTokens },
                Warnings = warnings,
                Sources = (completion.Sources ?? [])
                    .Select(s => new ActivitySourceDto { Url = s.Url, Title = s.Title })
                    .ToList(),
            };
        }
        catch (AiProviderException ex)
        {
            errorType = ex.ErrorType;
            logger.LogWarning(ex, "AI provider error during activity suggestion");
            return BadRequest(new { code = ex.ErrorType, message = ex.Message });
        }
        finally
        {
            stopwatch.Stop();
            await usageLogger.LogAsync(new AiUsageEntry(
                CurrentUserId,
                request.ClubId,
                TeamId: null,
                MemberId: null,
                AiFeature.ActivityImport,
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
    }
}
