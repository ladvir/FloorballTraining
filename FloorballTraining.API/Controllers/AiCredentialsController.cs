using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.API.Services.Ai;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// A user's own AI subscriptions (BYOK API keys). Keys are stored encrypted and are
/// never returned — responses carry only the last four characters. All mutations are
/// owner-only; sharing is club-wide only and revocable (see #45 / #68).
/// </summary>
[Authorize]
public class AiCredentialsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    IAiCredentialProtector protector,
    IAiClientFactory aiClientFactory,
    IAuditService auditService) : BaseApiController
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin");

    private AiCredentialDto ToDto(UserAiCredential c, Dictionary<int, string>? clubNames = null) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Provider = c.Provider,
        Model = c.Model,
        KeyLast4 = c.KeyLast4,
        IsActive = c.IsActive,
        NeedsReentry = protector.TryUnprotect(c.EncryptedApiKey) == null,
        LastValidatedAt = c.LastValidatedAt,
        LastUsedAt = c.LastUsedAt,
        Consents = c.Consents.Select(s => new AiConsentDto
        {
            Id = s.Id,
            Scope = s.Scope,
            ClubId = s.GrantedToClubId,
            ClubName = s.GrantedToClubId.HasValue
                ? clubNames?.GetValueOrDefault(s.GrantedToClubId.Value)
                : null,
            CreatedAt = s.CreatedAt
        }).ToList()
    };

    private static string Last4(string apiKey) =>
        apiKey.Length <= 4 ? apiKey : apiKey[^4..];

    private Task<UserAiCredential?> FindOwnAsync(int id) => context.UserAiCredentials
        .Include(c => c.Consents)
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == CurrentUserId);

    [HttpGet]
    public async Task<ActionResult<List<AiCredentialDto>>> GetMine()
    {
        var credentials = await context.UserAiCredentials
            .Include(c => c.Consents)
            .Where(c => c.UserId == CurrentUserId)
            .OrderBy(c => c.Name)
            .ToListAsync();

        var clubIds = credentials
            .SelectMany(c => c.Consents)
            .Where(s => s.GrantedToClubId.HasValue)
            .Select(s => s.GrantedToClubId!.Value)
            .Distinct()
            .ToList();
        var clubNames = await context.Clubs
            .Where(c => clubIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Name);

        return credentials.Select(c => ToDto(c, clubNames)).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<AiCredentialDto>> Create(CreateAiCredentialRequest request)
    {
        var nameTaken = await context.UserAiCredentials
            .AnyAsync(c => c.UserId == CurrentUserId && c.Name == request.Name);
        if (nameTaken)
            return Conflict(new { message = $"Credential named '{request.Name}' already exists." });

        var hasAnyActive = await context.UserAiCredentials
            .AnyAsync(c => c.UserId == CurrentUserId && c.IsActive);

        var credential = new UserAiCredential
        {
            UserId = CurrentUserId,
            Name = request.Name,
            Provider = request.Provider,
            EncryptedApiKey = protector.Protect(request.ApiKey),
            KeyLast4 = Last4(request.ApiKey),
            Model = string.IsNullOrWhiteSpace(request.Model) ? null : request.Model,
            // The first credential becomes active so AI works right after adding a key.
            IsActive = !hasAnyActive
        };

        context.UserAiCredentials.Add(credential);
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.AiCredentialCreated, nameof(UserAiCredential),
            credential.Id.ToString(), new { credential.Name, Provider = credential.Provider.ToString() });

        return ToDto(credential);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AiCredentialDto>> Update(int id, UpdateAiCredentialRequest request)
    {
        var credential = await FindOwnAsync(id);
        if (credential == null) return NotFound();

        var nameTaken = await context.UserAiCredentials
            .AnyAsync(c => c.UserId == CurrentUserId && c.Name == request.Name && c.Id != id);
        if (nameTaken)
            return Conflict(new { message = $"Credential named '{request.Name}' already exists." });

        credential.Name = request.Name;
        credential.Model = string.IsNullOrWhiteSpace(request.Model) ? null : request.Model;

        var keyRotated = !string.IsNullOrEmpty(request.ApiKey);
        if (keyRotated)
        {
            credential.EncryptedApiKey = protector.Protect(request.ApiKey!);
            credential.KeyLast4 = Last4(request.ApiKey!);
            credential.LastValidatedAt = null;
        }

        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.AiCredentialUpdated, nameof(UserAiCredential),
            credential.Id.ToString(), new { credential.Name, KeyRotated = keyRotated });

        return ToDto(credential);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var credential = await FindOwnAsync(id);
        if (credential == null) return NotFound();

        context.UserAiCredentials.Remove(credential);
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.AiCredentialDeleted, nameof(UserAiCredential),
            id.ToString(), new { credential.Name });

        return NoContent();
    }

    /// <summary>Makes this credential the user's single active one.</summary>
    [HttpPost("{id:int}/activate")]
    public async Task<ActionResult<AiCredentialDto>> Activate(int id)
    {
        var credential = await FindOwnAsync(id);
        if (credential == null) return NotFound();

        await using var transaction = await context.Database.BeginTransactionAsync();

        var others = await context.UserAiCredentials
            .Where(c => c.UserId == CurrentUserId && c.IsActive && c.Id != id)
            .ToListAsync();
        foreach (var other in others) other.IsActive = false;
        // Two SaveChanges inside the transaction: the filtered unique index on
        // (UserId) WHERE IsActive=1 would reject flipping both rows in one statement batch.
        await context.SaveChangesAsync();

        credential.IsActive = true;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        return ToDto(credential);
    }

    /// <summary>Tests a raw key against the provider before saving (never stored).</summary>
    [HttpPost("validate")]
    public async Task<ActionResult<AiKeyCheckResultDto>> ValidateRawKey(
        ValidateAiKeyRequest request, CancellationToken cancellationToken)
    {
        var result = await aiClientFactory
            .Create(request.Provider, request.ApiKey)
            .ValidateKeyAsync(cancellationToken);
        return new AiKeyCheckResultDto { Ok = result.Ok, Message = result.Message };
    }

    /// <summary>Tests a stored credential's key; records LastValidatedAt on success.</summary>
    [HttpPost("{id:int}/validate")]
    public async Task<ActionResult<AiKeyCheckResultDto>> ValidateStored(int id, CancellationToken cancellationToken)
    {
        var credential = await FindOwnAsync(id);
        if (credential == null) return NotFound();

        var apiKey = protector.TryUnprotect(credential.EncryptedApiKey);
        if (apiKey == null)
            return new AiKeyCheckResultDto { Ok = false, Message = "Stored key can no longer be read — re-enter it." };

        var result = await aiClientFactory
            .Create(credential.Provider, apiKey)
            .ValidateKeyAsync(cancellationToken);

        if (result.Ok)
        {
            credential.LastValidatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
        }

        return new AiKeyCheckResultDto { Ok = result.Ok, Message = result.Message };
    }

    /// <summary>Owner grants the whole club consent to use this credential (as club default).</summary>
    [HttpPost("{id:int}/share")]
    public async Task<ActionResult<AiConsentDto>> Share(int id, ShareAiCredentialRequest request)
    {
        var credential = await FindOwnAsync(id);
        if (credential == null) return NotFound();

        var club = await context.Clubs.FindAsync(request.ClubId);
        if (club == null) return NotFound(new { message = "Club not found." });

        // Sharing only makes sense towards a club the owner belongs to (Admin: any club).
        if (!IsAdmin())
        {
            var memberships = await clubRoleService.GetAllUserClubRolesAsync(CurrentUserId);
            if (memberships.All(m => m.ClubId != request.ClubId))
                return Forbid();
        }

        var exists = credential.Consents
            .Any(s => s.Scope == AiConsentScope.Club && s.GrantedToClubId == request.ClubId);
        if (exists)
            return Conflict(new { message = "Credential is already shared with this club." });

        var consent = new AiCredentialConsent
        {
            CredentialId = credential.Id,
            Scope = AiConsentScope.Club,
            GrantedToClubId = request.ClubId
        };
        context.AiCredentialConsents.Add(consent);
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.AiConsentGranted, nameof(AiCredentialConsent),
            consent.Id.ToString(), new { CredentialId = id, request.ClubId, Scope = "Club" });

        return new AiConsentDto
        {
            Id = consent.Id,
            Scope = consent.Scope,
            ClubId = consent.GrantedToClubId,
            ClubName = club.Name,
            CreatedAt = consent.CreatedAt
        };
    }

    /// <summary>Owner revokes a consent. Takes effect immediately — the resolver re-checks per call.</summary>
    [HttpDelete("{id:int}/share/{consentId:int}")]
    public async Task<IActionResult> Revoke(int id, int consentId)
    {
        var credential = await FindOwnAsync(id);
        if (credential == null) return NotFound();

        var consent = credential.Consents.FirstOrDefault(s => s.Id == consentId);
        if (consent == null) return NotFound();

        context.AiCredentialConsents.Remove(consent);
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.AiConsentRevoked, nameof(AiCredentialConsent),
            consentId.ToString(),
            new { CredentialId = id, consent.GrantedToClubId, Scope = consent.Scope.ToString() });

        return NoContent();
    }
}
