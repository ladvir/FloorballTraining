using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;

namespace FloorballTraining.API.Services.Ai;

/// <summary>
/// Anthropic Messages API (https://api.anthropic.com/v1/messages). SSE stream events:
/// message_start carries usage.input_tokens, content_block_delta/text_delta the text,
/// message_delta the final usage.output_tokens. Key check: GET /v1/models (no token cost).
/// </summary>
public class AnthropicChatClient(HttpClient httpClient, string apiKey) : IAiChatClient
{
    private const string BaseUrl = "https://api.anthropic.com";
    private const string ApiVersion = "2023-06-01";

    private HttpRequestMessage BuildRequest(HttpMethod method, string path, object? body = null)
    {
        var request = new HttpRequestMessage(method, $"{BaseUrl}{path}");
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", ApiVersion);
        if (body != null)
            request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        return request;
    }

    private object BuildBody(AiChatRequest chat, bool stream) => new
    {
        model = chat.Model,
        max_tokens = chat.MaxTokens,
        system = chat.SystemPrompt,
        messages = new[] { new { role = "user", content = chat.UserPrompt } },
        stream
    };

    public async IAsyncEnumerable<AiStreamEvent> StreamAsync(
        AiChatRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Post, "/v1/messages", BuildBody(request, stream: true));
        using var response = await httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw AiProviderException.FromStatusCode(response.StatusCode, await response.Content.ReadAsStringAsync(cancellationToken));

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        await foreach (var sse in SseLineReader.ReadAsync(stream, cancellationToken))
        {
            using var doc = JsonDocument.Parse(sse.Data);
            var root = doc.RootElement;
            var type = root.TryGetProperty("type", out var t) ? t.GetString() : null;

            switch (type)
            {
                case "message_start":
                    if (root.TryGetProperty("message", out var message)
                        && message.TryGetProperty("usage", out var startUsage)
                        && startUsage.TryGetProperty("input_tokens", out var inputTokens))
                        yield return new AiUsageEvent(inputTokens.GetInt32(), 0);
                    break;

                case "content_block_delta":
                    if (root.TryGetProperty("delta", out var delta)
                        && delta.TryGetProperty("type", out var deltaType)
                        && deltaType.GetString() == "text_delta"
                        && delta.TryGetProperty("text", out var text))
                        yield return new AiTextDelta(text.GetString() ?? "");
                    break;

                case "message_delta":
                    if (root.TryGetProperty("usage", out var deltaUsage)
                        && deltaUsage.TryGetProperty("output_tokens", out var outputTokens))
                        yield return new AiUsageEvent(0, outputTokens.GetInt32());
                    break;

                case "error":
                    var errorMessage = root.TryGetProperty("error", out var error)
                                       && error.TryGetProperty("message", out var msg)
                        ? msg.GetString()
                        : "unknown";
                    throw new AiProviderException("ProviderError", $"Anthropic stream error: {errorMessage}");
            }
        }
    }

    public async Task<AiChatResult> CompleteAsync(AiChatRequest request, CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Post, "/v1/messages", BuildBody(request, stream: false));
        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw AiProviderException.FromStatusCode(response.StatusCode, body);

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        var text = new StringBuilder();
        if (root.TryGetProperty("content", out var content))
            foreach (var block in content.EnumerateArray())
                if (block.TryGetProperty("type", out var blockType) && blockType.GetString() == "text"
                    && block.TryGetProperty("text", out var blockText))
                    text.Append(blockText.GetString());

        var input = 0;
        var output = 0;
        if (root.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("input_tokens", out var i)) input = i.GetInt32();
            if (usage.TryGetProperty("output_tokens", out var o)) output = o.GetInt32();
        }

        return new AiChatResult(text.ToString(), input, output);
    }

    public async Task<AiKeyCheckResult> ValidateKeyAsync(CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Get, "/v1/models");
        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        return response.IsSuccessStatusCode
            ? new AiKeyCheckResult(true, null)
            : new AiKeyCheckResult(false, $"Anthropic returned {(int)response.StatusCode}");
    }
}
