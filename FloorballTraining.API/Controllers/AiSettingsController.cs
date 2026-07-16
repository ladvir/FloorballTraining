using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// AI enablement and default credentials. One global row (kill-switch + global default,
/// Admin only) and one row per club. Enabling a club is Admin-only; the club's
/// HeadCoach/ClubAdmin may only pick the club default from club-consented credentials.
/// </summary>
[Authorize]
public class AiSettingsController(
    FloorballTrainingContext context,
    IClubRoleService clubRoleService,
    IAuditService auditService) : BaseApiController
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin() => User.IsInRole("Admin");

    private async Task<bool> IsClubManagerAsync(int clubId)
    {
        if (IsAdmin()) return true;
        var roles = await clubRoleService.GetAllUserClubRolesAsync(CurrentUserId);
        return roles.Any(r => r.ClubId == clubId && r.EffectiveRole is "ClubAdmin" or "HeadCoach");
    }

    private async Task<AiSettingsDto> ToDtoAsync(AiSettings? settings, int? clubId)
    {
        var dto = new AiSettingsDto { ClubId = clubId, Enabled = settings?.Enabled ?? false };
        if (settings?.DefaultCredentialId == null) return dto;

        var credential = await context.UserAiCredentials
            .Include(c => c.Consents)
            .FirstOrDefaultAsync(c => c.Id == settings.DefaultCredentialId.Value);

        dto.DefaultCredentialId = settings.DefaultCredentialId;
        dto.DefaultModel = settings.DefaultModel;

        if (credential == null) return dto; // deleted → DefaultValid stays false

        dto.DefaultCredentialName = credential.Name;
        dto.DefaultCredentialProvider = credential.Provider;
        // The default is only usable while the owner's consent is still in place.
        dto.DefaultValid = clubId.HasValue
            ? credential.Consents.Any(s => s.Scope == AiConsentScope.Club && s.GrantedToClubId == clubId.Value)
            : credential.Consents.Any(s => s.Scope == AiConsentScope.Global);
        return dto;
    }

    private Task<AiSettings?> FindSettingsAsync(int? clubId) =>
        context.AiSettings.FirstOrDefaultAsync(s => s.ClubId == clubId);

    // ── Global ───────────────────────────────────────────────────────────────

    [HttpGet("global")]
    public async Task<ActionResult<AiSettingsDto>> GetGlobal()
    {
        if (!IsAdmin()) return Forbid();
        return await ToDtoAsync(await FindSettingsAsync(null), null);
    }

    [HttpPut("global")]
    public async Task<ActionResult<AiSettingsDto>> UpdateGlobal(UpdateAiSettingsRequest request)
    {
        if (!IsAdmin()) return Forbid();

        if (request.DefaultCredentialId.HasValue)
        {
            var credential = await context.UserAiCredentials
                .Include(c => c.Consents)
                .FirstOrDefaultAsync(c => c.Id == request.DefaultCredentialId.Value);
            if (credential == null)
                return BadRequest(new { message = "Credential not found." });

            var hasGlobalConsent = credential.Consents.Any(s => s.Scope == AiConsentScope.Global);
            if (!hasGlobalConsent)
            {
                // Setting one's own credential as the global default IS the owner's consent.
                if (credential.UserId != CurrentUserId)
                    return BadRequest(new { message = "Credential has no global consent from its owner." });

                context.AiCredentialConsents.Add(new AiCredentialConsent
                {
                    CredentialId = credential.Id,
                    Scope = AiConsentScope.Global
                });
            }
        }

        var settings = await FindSettingsAsync(null);
        if (settings == null)
        {
            settings = new AiSettings();
            context.AiSettings.Add(settings);
        }

        settings.Enabled = request.Enabled;
        settings.DefaultCredentialId = request.DefaultCredentialId;
        settings.DefaultModel = string.IsNullOrWhiteSpace(request.DefaultModel) ? null : request.DefaultModel;
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.AiSettingsUpdated, nameof(AiSettings),
            settings.Id.ToString(),
            new { Scope = "Global", settings.Enabled, settings.DefaultCredentialId });

        return await ToDtoAsync(settings, null);
    }

    // ── Per club ─────────────────────────────────────────────────────────────

    [HttpGet("club/{clubId:int}")]
    public async Task<ActionResult<AiSettingsDto>> GetClub(int clubId)
    {
        if (!await IsClubManagerAsync(clubId)) return Forbid();
        if (!await context.Clubs.AnyAsync(c => c.Id == clubId)) return NotFound();
        return await ToDtoAsync(await FindSettingsAsync(clubId), clubId);
    }

    /// <summary>Credentials the club's default can be picked from (active Club consent).</summary>
    [HttpGet("club/{clubId:int}/credentials")]
    public async Task<ActionResult<List<EligibleCredentialDto>>> GetClubEligibleCredentials(int clubId)
    {
        if (!await IsClubManagerAsync(clubId)) return Forbid();

        return await context.AiCredentialConsents
            .Where(s => s.Scope == AiConsentScope.Club && s.GrantedToClubId == clubId)
            .Select(s => new EligibleCredentialDto
            {
                Id = s.Credential!.Id,
                Name = s.Credential.Name,
                Provider = s.Credential.Provider,
                Model = s.Credential.Model,
                OwnerName = context.Users
                    .Where(u => u.Id == s.Credential.UserId)
                    .Select(u => (u.FirstName + " " + u.LastName).Trim())
                    .FirstOrDefault() ?? ""
            })
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    [HttpPut("club/{clubId:int}")]
    public async Task<ActionResult<AiSettingsDto>> UpdateClub(int clubId, UpdateAiSettingsRequest request)
    {
        if (!await IsClubManagerAsync(clubId)) return Forbid();
        if (!await context.Clubs.AnyAsync(c => c.Id == clubId)) return NotFound();

        var settings = await FindSettingsAsync(clubId);

        // Enabling/disabling AI for a club is the Admin's decision alone.
        var currentEnabled = settings?.Enabled ?? false;
        if (request.Enabled != currentEnabled && !IsAdmin())
            return Forbid();

        if (request.DefaultCredentialId.HasValue)
        {
            var hasClubConsent = await context.AiCredentialConsents.AnyAsync(s =>
                s.CredentialId == request.DefaultCredentialId.Value
                && s.Scope == AiConsentScope.Club
                && s.GrantedToClubId == clubId);
            if (!hasClubConsent)
                return BadRequest(new { message = "Credential is not shared with this club by its owner." });
        }

        if (settings == null)
        {
            settings = new AiSettings { ClubId = clubId };
            context.AiSettings.Add(settings);
        }

        settings.Enabled = request.Enabled;
        settings.DefaultCredentialId = request.DefaultCredentialId;
        settings.DefaultModel = string.IsNullOrWhiteSpace(request.DefaultModel) ? null : request.DefaultModel;
        await context.SaveChangesAsync();

        await auditService.LogAsync(AuditActions.AiSettingsUpdated, nameof(AiSettings),
            settings.Id.ToString(),
            new { Scope = "Club", ClubId = clubId, settings.Enabled, settings.DefaultCredentialId });

        return await ToDtoAsync(settings, clubId);
    }

    /// <summary>All clubs with their AI settings — the Admin management overview.</summary>
    [HttpGet("clubs")]
    public async Task<ActionResult<List<AiSettingsDto>>> GetAllClubs()
    {
        if (!IsAdmin()) return Forbid();

        var clubs = await context.Clubs.OrderBy(c => c.Name).Select(c => c.Id).ToListAsync();
        var result = new List<AiSettingsDto>();
        foreach (var clubId in clubs)
            result.Add(await ToDtoAsync(await FindSettingsAsync(clubId), clubId));
        return result;
    }

    // ── Status for the current user ──────────────────────────────────────────

    /// <summary>
    /// Whether AI is available to the current user in the given club, and via which
    /// credential source. Drives visibility of AI actions in the client. Mirrors the
    /// resolution pipeline (own active → club default → global default) without decrypting.
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<AiStatusDto>> GetStatus([FromQuery] int? clubId)
    {
        var globalSettings = await FindSettingsAsync(null);
        var clubSettings = clubId.HasValue ? await FindSettingsAsync(clubId.Value) : null;

        var enabled = (globalSettings?.Enabled ?? false) && (clubSettings?.Enabled ?? false);
        var status = new AiStatusDto { Enabled = enabled };
        if (!enabled) return status;

        var own = await context.UserAiCredentials
            .FirstOrDefaultAsync(c => c.UserId == CurrentUserId && c.IsActive);
        if (own != null)
        {
            status.HasCredential = true;
            status.Source = AiCredentialSource.Own;
            status.Provider = own.Provider;
            status.Model = own.Model;
            return status;
        }

        if (clubSettings?.DefaultCredentialId != null)
        {
            var clubDefault = await context.UserAiCredentials
                .Include(c => c.Consents)
                .FirstOrDefaultAsync(c => c.Id == clubSettings.DefaultCredentialId.Value);
            if (clubDefault != null && clubDefault.Consents.Any(s =>
                    s.Scope == AiConsentScope.Club && s.GrantedToClubId == clubId))
            {
                status.HasCredential = true;
                status.Source = AiCredentialSource.ClubDefault;
                status.Provider = clubDefault.Provider;
                status.Model = clubSettings.DefaultModel ?? clubDefault.Model;
                return status;
            }
        }

        if (globalSettings?.DefaultCredentialId != null)
        {
            var globalDefault = await context.UserAiCredentials
                .Include(c => c.Consents)
                .FirstOrDefaultAsync(c => c.Id == globalSettings.DefaultCredentialId.Value);
            if (globalDefault != null && globalDefault.Consents.Any(s => s.Scope == AiConsentScope.Global))
            {
                status.HasCredential = true;
                status.Source = AiCredentialSource.GlobalDefault;
                status.Provider = globalDefault.Provider;
                status.Model = globalSettings.DefaultModel ?? globalDefault.Model;
            }
        }

        return status;
    }
}
