using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;

namespace FloorballTraining.API.Services.Ai;

/// <summary>
/// Google Gemini API (generativelanguage.googleapis.com/v1beta). Streaming uses
/// models/{model}:streamGenerateContent?alt=sse; usageMetadata arrives cumulatively —
/// the last report wins. Key check: GET /v1beta/models.
/// </summary>
public class GeminiChatClient(HttpClient httpClient, string apiKey) : IAiChatClient
{
    private const string BaseUrl = "https://generativelanguage.googleapis.com";

    private HttpRequestMessage BuildRequest(HttpMethod method, string path, object? body = null)
    {
        var request = new HttpRequestMessage(method, $"{BaseUrl}{path}");
        request.Headers.Add("x-goog-api-key", apiKey);
        if (body != null)
            request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        return request;
    }

    private static object BuildBody(AiChatRequest chat) => new
    {
        system_instruction = new { parts = new[] { new { text = chat.SystemPrompt } } },
        contents = new[] { new { role = "user", parts = new[] { new { text = chat.UserPrompt } } } },
        generationConfig = new { maxOutputTokens = chat.MaxTokens }
    };

    // The model id ends up in the URL path — escape it so a malformed value cannot
    // change the request target.
    private static string ModelPath(string model, string action) =>
        $"/v1beta/models/{Uri.EscapeDataString(model)}:{action}";

    public async IAsyncEnumerable<AiStreamEvent> StreamAsync(
        AiChatRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(
            HttpMethod.Post,
            ModelPath(request.Model, "streamGenerateContent") + "?alt=sse",
            BuildBody(request));
        using var response = await httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw AiProviderException.FromStatusCode(response.StatusCode, await response.Content.ReadAsStringAsync(cancellationToken));

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        await foreach (var sse in SseLineReader.ReadAsync(stream, cancellationToken))
        {
            using var doc = JsonDocument.Parse(sse.Data);
            var root = doc.RootElement;

            if (root.TryGetProperty("candidates", out var candidates))
                foreach (var candidate in candidates.EnumerateArray())
                    if (candidate.TryGetProperty("content", out var content)
                        && content.TryGetProperty("parts", out var parts))
                        foreach (var part in parts.EnumerateArray())
                            if (part.TryGetProperty("text", out var text))
                                yield return new AiTextDelta(text.GetString() ?? "");

            if (root.TryGetProperty("usageMetadata", out var usage))
            {
                var input = usage.TryGetProperty("promptTokenCount", out var i) ? i.GetInt32() : 0;
                var output = usage.TryGetProperty("candidatesTokenCount", out var o) ? o.GetInt32() : 0;
                yield return new AiUsageEvent(input, output);
            }
        }
    }

    public async Task<AiChatResult> CompleteAsync(AiChatRequest request, CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Post, ModelPath(request.Model, "generateContent"), BuildBody(request));
        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw AiProviderException.FromStatusCode(response.StatusCode, body);

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        var text = new StringBuilder();
        if (root.TryGetProperty("candidates", out var candidates))
            foreach (var candidate in candidates.EnumerateArray())
                if (candidate.TryGetProperty("content", out var content)
                    && content.TryGetProperty("parts", out var parts))
                    foreach (var part in parts.EnumerateArray())
                        if (part.TryGetProperty("text", out var partText))
                            text.Append(partText.GetString());

        var input = 0;
        var output = 0;
        if (root.TryGetProperty("usageMetadata", out var usage))
        {
            if (usage.TryGetProperty("promptTokenCount", out var i)) input = i.GetInt32();
            if (usage.TryGetProperty("candidatesTokenCount", out var o)) output = o.GetInt32();
        }

        return new AiChatResult(text.ToString(), input, output);
    }

    public async Task<AiKeyCheckResult> ValidateKeyAsync(CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Get, "/v1beta/models");
        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        return response.IsSuccessStatusCode
            ? new AiKeyCheckResult(true, null)
            : new AiKeyCheckResult(false, $"Gemini returned {(int)response.StatusCode}");
    }
}
