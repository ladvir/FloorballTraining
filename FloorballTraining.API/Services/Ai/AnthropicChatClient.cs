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

    // web_search_20250305: Claude decides on its own whether/how many times to search;
    // max_uses caps runaway search loops. No beta header required — GA server tool.
    private object BuildWebSearchBody(AiChatRequest chat) => new
    {
        model = chat.Model,
        max_tokens = chat.MaxTokens,
        system = chat.SystemPrompt,
        messages = new[] { new { role = "user", content = chat.UserPrompt } },
        tools = new object[] { new { type = "web_search_20250305", name = "web_search", max_uses = 3 } },
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

    /// <summary>
    /// Non-streaming completion with web search enabled. The content array now mixes
    /// server_tool_use/web_search_tool_result blocks in with text blocks — only "text"
    /// blocks contribute to the answer; citations on those blocks become Sources.
    /// </summary>
    public async Task<AiChatResult> CompleteWithWebSearchAsync(AiChatRequest request, CancellationToken cancellationToken)
    {
        using var httpRequest = BuildRequest(HttpMethod.Post, "/v1/messages", BuildWebSearchBody(request));
        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw AiProviderException.FromStatusCode(response.StatusCode, body);

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        var text = new StringBuilder();
        var sources = new List<AiWebSource>();
        var seenUrls = new HashSet<string>();

        void AddSource(string? url, string? title)
        {
            if (!string.IsNullOrEmpty(url) && seenUrls.Add(url))
                sources.Add(new AiWebSource(url, title));
        }

        if (root.TryGetProperty("content", out var content))
            foreach (var block in content.EnumerateArray())
            {
                if (!block.TryGetProperty("type", out var blockType)) continue;
                switch (blockType.GetString())
                {
                    case "text":
                        if (block.TryGetProperty("text", out var blockText))
                            text.Append(blockText.GetString());
                        if (block.TryGetProperty("citations", out var citations)
                            && citations.ValueKind == JsonValueKind.Array)
                            foreach (var citation in citations.EnumerateArray())
                                AddSource(
                                    citation.TryGetProperty("url", out var u) ? u.GetString() : null,
                                    citation.TryGetProperty("title", out var t) ? t.GetString() : null);
                        break;

                    case "web_search_tool_result":
                        if (block.TryGetProperty("content", out var results)
                            && results.ValueKind == JsonValueKind.Array)
                            foreach (var result in results.EnumerateArray())
                                AddSource(
                                    result.TryGetProperty("url", out var u) ? u.GetString() : null,
                                    result.TryGetProperty("title", out var t) ? t.GetString() : null);
                        break;
                }
            }

        var input = 0;
        var output = 0;
        if (root.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("input_tokens", out var i)) input = i.GetInt32();
            if (usage.TryGetProperty("output_tokens", out var o)) output = o.GetInt32();
        }

        return new AiChatResult(text.ToString(), input, output, sources);
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
