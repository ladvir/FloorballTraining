using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;

namespace FloorballTraining.API.Services.Ai;

/// <summary>
/// OpenAI Chat Completions API (https://api.openai.com/v1/chat/completions).
/// Streaming REQUIRES stream_options.include_usage, otherwise usage never arrives;
/// the usage chunk is the last one before "data: [DONE]" and has an empty choices
/// array. Key check: GET /v1/models.
/// </summary>
public class OpenAiChatClient(HttpClient httpClient, string apiKey) : IAiChatClient
{
    private const string BaseUrl = "https://api.openai.com";

    private HttpRequestMessage BuildRequest(HttpMethod method, string path, object? body = null)
    {
        var request = new HttpRequestMessage(method, $"{BaseUrl}{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        if (body != null)
            request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        return request;
    }

    private static object BuildBody(AiChatRequest chat, bool stream)
    {
        var messages = new[]
        {
            new { role = "system", content = chat.SystemPrompt },
            new { role = "user", content = chat.UserPrompt }
        };
        return stream
            ? new
            {
                model = chat.Model,
                max_completion_tokens = chat.MaxTokens,
                messages,
                stream = true,
                stream_options = new { include_usage = true }
            }
            : (object)new
            {
                model = chat.Model,
                max_completion_tokens = chat.MaxTokens,
                messages
            };
    }

    public async IAsyncEnumerable<AiStreamEvent> StreamAsync(
        AiChatRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Post, "/v1/chat/completions", BuildBody(request, stream: true));
        using var response = await httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw AiProviderException.FromStatusCode(response.StatusCode, await response.Content.ReadAsStringAsync(cancellationToken));

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        await foreach (var sse in SseLineReader.ReadAsync(stream, cancellationToken))
        {
            if (sse.Data == "[DONE]")
                yield break;

            using var doc = JsonDocument.Parse(sse.Data);
            var root = doc.RootElement;

            if (root.TryGetProperty("choices", out var choices))
                foreach (var choice in choices.EnumerateArray())
                    if (choice.TryGetProperty("delta", out var delta)
                        && delta.TryGetProperty("content", out var content)
                        && content.ValueKind == JsonValueKind.String)
                        yield return new AiTextDelta(content.GetString() ?? "");

            if (root.TryGetProperty("usage", out var usage) && usage.ValueKind == JsonValueKind.Object)
            {
                var input = usage.TryGetProperty("prompt_tokens", out var i) ? i.GetInt32() : 0;
                var output = usage.TryGetProperty("completion_tokens", out var o) ? o.GetInt32() : 0;
                yield return new AiUsageEvent(input, output);
            }
        }
    }

    public async Task<AiChatResult> CompleteAsync(AiChatRequest request, CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Post, "/v1/chat/completions", BuildBody(request, stream: false));
        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw AiProviderException.FromStatusCode(response.StatusCode, body);

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        var text = "";
        if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
        {
            var message = choices[0].GetProperty("message");
            if (message.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String)
                text = content.GetString() ?? "";
        }

        var input = 0;
        var output = 0;
        if (root.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("prompt_tokens", out var i)) input = i.GetInt32();
            if (usage.TryGetProperty("completion_tokens", out var o)) output = o.GetInt32();
        }

        return new AiChatResult(text, input, output);
    }

    public async Task<AiKeyCheckResult> ValidateKeyAsync(CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Get, "/v1/models");
        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        return response.IsSuccessStatusCode
            ? new AiKeyCheckResult(true, null)
            : new AiKeyCheckResult(false, $"OpenAI returned {(int)response.StatusCode}");
    }
}
