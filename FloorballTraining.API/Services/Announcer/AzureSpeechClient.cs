using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace FloorballTraining.API.Services.Announcer;

/// <summary>Thin typed wrapper over the Azure AI Speech REST text-to-speech API. Region + key are
/// passed per call (from the caller's stored, decrypted credential) — nothing about Azure is
/// configured globally. ponytail: intentionally not unit-tested — it is a straight HTTP mapping;
/// the controller paths that don't need the network are covered by AnnouncerTtsTests.</summary>
public interface IAzureSpeechClient
{
    /// <summary>Lists the region's neural voices. Doubles as key/region validation (200 = ok);
    /// throws <see cref="AzureSpeechException"/> otherwise.</summary>
    Task<IReadOnlyList<AzureVoice>> GetVoicesAsync(string region, string apiKey, CancellationToken ct);

    /// <summary>Synthesizes an SSML document to an MP3 (24 kHz / 48 kbps). Announcements are short,
    /// so the bytes are buffered.</summary>
    Task<byte[]> SynthesizeMp3Async(string region, string apiKey, string ssml, CancellationToken ct);
}

public sealed record AzureVoice(
    string ShortName, string DisplayName, string LocalName, string Gender,
    string Locale, string LocaleName, IReadOnlyList<string> StyleList, string? WordsPerMinute);

/// <summary>Azure Speech returned a non-success status; <see cref="StatusCode"/> is the upstream code.</summary>
public sealed class AzureSpeechException(string message, int statusCode) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public sealed partial class AzureSpeechClient(
    IHttpClientFactory httpClientFactory, ILogger<AzureSpeechClient> logger) : IAzureSpeechClient
{
    // The region is interpolated into the request host, so it must be strictly validated
    // (letters/digits only) to keep it from redirecting the call elsewhere.
    [GeneratedRegex("^[a-z0-9]{3,30}$")]
    private static partial Regex RegionRegex();

    public static bool IsValidRegion(string? region) => region != null && RegionRegex().IsMatch(region);

    private const string OutputFormat = "audio-24khz-48kbitrate-mono-mp3";

    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    private static string Host(string region) => $"https://{region}.tts.speech.microsoft.com";

    private HttpClient NewClient(string apiKey)
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(30);
        client.DefaultRequestHeaders.TryAddWithoutValidation("Ocp-Apim-Subscription-Key", apiKey);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("FloTr-Announcer");
        return client;
    }

    public async Task<IReadOnlyList<AzureVoice>> GetVoicesAsync(string region, string apiKey, CancellationToken ct)
    {
        if (!IsValidRegion(region)) throw new AzureSpeechException("Neplatný Azure region.", 400);

        using var client = NewClient(apiKey);
        using var resp = await client.GetAsync($"{Host(region)}/cognitiveservices/voices/list", ct);
        await EnsureOkAsync(resp, ct);

        using var stream = await resp.Content.ReadAsStreamAsync(ct);
        var raw = await JsonSerializer.DeserializeAsync<List<VoiceDto>>(stream, Json, ct) ?? [];
        return raw
            .Where(v => !string.IsNullOrEmpty(v.ShortName))
            .Select(v => new AzureVoice(
                v.ShortName!, v.DisplayName ?? v.ShortName!, v.LocalName ?? v.DisplayName ?? v.ShortName!,
                v.Gender ?? "", v.Locale ?? "", v.LocaleName ?? "",
                v.StyleList ?? [], v.WordsPerMinute))
            .ToList();
    }

    public async Task<byte[]> SynthesizeMp3Async(string region, string apiKey, string ssml, CancellationToken ct)
    {
        if (!IsValidRegion(region)) throw new AzureSpeechException("Neplatný Azure region.", 400);

        using var client = NewClient(apiKey);
        using var msg = new HttpRequestMessage(HttpMethod.Post, $"{Host(region)}/cognitiveservices/v1")
        {
            Content = new StringContent(ssml, Encoding.UTF8, "application/ssml+xml"),
        };
        msg.Headers.TryAddWithoutValidation("X-Microsoft-OutputFormat", OutputFormat);

        using var resp = await client.SendAsync(msg, HttpCompletionOption.ResponseContentRead, ct);
        await EnsureOkAsync(resp, ct);
        return await resp.Content.ReadAsByteArrayAsync(ct);
    }

    private async Task EnsureOkAsync(HttpResponseMessage resp, CancellationToken ct)
    {
        if (resp.IsSuccessStatusCode) return;

        var text = await SafeReadAsync(resp, ct);
        var code = (int)resp.StatusCode;
        logger.LogWarning("Azure Speech {Status} for {Path}: {Body}",
            code, resp.RequestMessage?.RequestUri?.AbsolutePath, Truncate(text, 500));

        var message = resp.StatusCode switch
        {
            HttpStatusCode.Unauthorized => "Neplatný klíč nebo region.",
            HttpStatusCode.BadRequest => "Azure Speech: neplatný požadavek (SSML nebo hlas).",
            (HttpStatusCode)429 => "Azure Speech: překročen limit požadavků, zkuste to za chvíli.",
            _ => $"Azure Speech vrátil chybu {code}.",
        };
        throw new AzureSpeechException(message, code);
    }

    private static async Task<string> SafeReadAsync(HttpResponseMessage resp, CancellationToken ct)
    {
        try { return await resp.Content.ReadAsStringAsync(ct); }
        catch { return string.Empty; }
    }

    private static string Truncate(string s, int n) => s.Length <= n ? s : s[..n];

    // ── wire DTO (Azure uses PascalCase JSON) ─────────────────────────────────
    private sealed class VoiceDto
    {
        public string? ShortName { get; set; }
        public string? DisplayName { get; set; }
        public string? LocalName { get; set; }
        public string? Gender { get; set; }
        public string? Locale { get; set; }
        public string? LocaleName { get; set; }
        public List<string>? StyleList { get; set; }
        public string? WordsPerMinute { get; set; }
    }
}
