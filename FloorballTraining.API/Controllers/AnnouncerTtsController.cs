using System.Security.Claims;
using System.Xml;
using System.Xml.Linq;
using FloorballTraining.API.Services.Ai;
using FloorballTraining.API.Services.Announcer;
using FloorballTraining.CoreBusiness;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Controllers;

/// <summary>
/// External (Azure AI Speech) voice for the Hlasatel announcer. The user brings their own Azure
/// Speech resource — region + key are validated on entry, the key is stored encrypted and used
/// only here: the browser posts SSML to <c>/announcer/tts/speak</c> and gets an MP3 back, the key
/// never reaches the client. The built-in Web Speech voice keeps working with no key; this is the
/// opt-in premium path.
/// </summary>
[Authorize]
[Route("announcer/tts")]
public class AnnouncerTtsController(
    FloorballTrainingContext context,
    IAiCredentialProtector protector,
    IAzureSpeechClient azure) : BaseApiController
{
    private const int MaxSsmlChars = 12000;

    public record StatusDto(bool Configured, string? Region, string? KeyLast4);
    public record SaveKeyRequest(string Region, string ApiKey);
    public record VoiceDto(
        string ShortName, string DisplayName, string LocalName, string Gender,
        string Locale, string LocaleName, IReadOnlyList<string> StyleList, string? WordsPerMinute);
    public record SpeakRequest(string Ssml);

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private Task<AnnouncerTtsCredential?> GetCredentialAsync() =>
        context.AnnouncerTtsCredentials.FirstOrDefaultAsync(c => c.UserId == UserId);

    /// <summary>Region + decrypted key, or a 409 problem when nothing usable is stored.</summary>
    private async Task<(string region, string key, IActionResult? error)> ResolveAsync()
    {
        var cred = await GetCredentialAsync();
        if (cred == null) return ("", "", Conflict("Azure Speech není připojen."));
        var key = protector.TryUnprotect(cred.EncryptedApiKey);
        return key == null
            ? ("", "", Conflict("Uložený klíč nelze načíst — zadejte ho prosím znovu."))
            : (cred.Region, key, null);
    }

    [HttpGet("status")]
    public async Task<ActionResult<StatusDto>> GetStatus()
    {
        var cred = await GetCredentialAsync();
        if (cred == null) return Ok(new StatusDto(false, null, null));
        var ok = protector.TryUnprotect(cred.EncryptedApiKey) != null;
        return Ok(new StatusDto(ok, cred.Region, cred.KeyLast4));
    }

    [HttpPut("key")]
    public async Task<ActionResult<StatusDto>> SaveKey(SaveKeyRequest req)
    {
        var region = (req.Region ?? "").Trim().ToLowerInvariant();
        var apiKey = (req.ApiKey ?? "").Trim();
        if (!AzureSpeechClient.IsValidRegion(region))
            return BadRequest("Zadejte platný Azure region (např. westeurope).");
        if (apiKey.Length < 8) return BadRequest("Zadejte platný Azure Speech klíč.");

        try
        {
            // Listing voices is the cheapest call that proves region+key are valid.
            await azure.GetVoicesAsync(region, apiKey, HttpContext.RequestAborted);
        }
        catch (AzureSpeechException ex)
        {
            return BadRequest(ex.Message);
        }

        var cred = await GetCredentialAsync();
        if (cred == null)
        {
            cred = new AnnouncerTtsCredential { UserId = UserId };
            context.AnnouncerTtsCredentials.Add(cred);
        }
        cred.Region = region;
        cred.EncryptedApiKey = protector.Protect(apiKey);
        cred.KeyLast4 = apiKey.Length >= 4 ? apiKey[^4..] : apiKey;
        cred.LastValidatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return Ok(new StatusDto(true, cred.Region, cred.KeyLast4));
    }

    [HttpDelete("key")]
    public async Task<IActionResult> DeleteKey()
    {
        await context.AnnouncerTtsCredentials.Where(c => c.UserId == UserId).ExecuteDeleteAsync();
        return NoContent();
    }

    [HttpGet("voices")]
    public async Task<IActionResult> GetVoices()
    {
        var (region, key, error) = await ResolveAsync();
        if (error != null) return error;
        try
        {
            var voices = await azure.GetVoicesAsync(region, key, HttpContext.RequestAborted);
            return Ok(voices
                .Select(v => new VoiceDto(v.ShortName, v.DisplayName, v.LocalName, v.Gender,
                    v.Locale, v.LocaleName, v.StyleList, v.WordsPerMinute))
                .ToList());
        }
        catch (AzureSpeechException ex)
        {
            return StatusCode(ex.StatusCode == 401 ? 409 : 502, ex.Message);
        }
    }

    [HttpPost("speak")]
    public async Task<IActionResult> Speak(SpeakRequest req)
    {
        var ssml = (req.Ssml ?? "").Trim();
        if (ssml.Length == 0) return BadRequest("Prázdné SSML.");
        if (ssml.Length > MaxSsmlChars) return BadRequest($"SSML je delší než {MaxSsmlChars} znaků.");

        // The client builds the SSML; validate it is well-formed and rooted at <speak>
        // before forwarding (Azure would 400 anyway, but this keeps the error local & clear).
        try
        {
            var doc = XDocument.Parse(ssml, LoadOptions.None);
            if (doc.Root is null || doc.Root.Name.LocalName != "speak")
                return BadRequest("SSML musí mít kořen <speak>.");
        }
        catch (XmlException)
        {
            return BadRequest("Neplatné SSML (chybný XML).");
        }

        var (region, key, error) = await ResolveAsync();
        if (error != null) return error;

        try
        {
            var mp3 = await azure.SynthesizeMp3Async(region, key, ssml, HttpContext.RequestAborted);
            return File(mp3, "audio/mpeg");
        }
        catch (AzureSpeechException ex)
        {
            return StatusCode(ex.StatusCode == 401 ? 409 : 502, ex.Message);
        }
    }
}
