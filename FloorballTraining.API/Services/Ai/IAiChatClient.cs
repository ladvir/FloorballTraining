namespace FloorballTraining.API.Services.Ai;

/// <summary>One chat exchange sent to an AI provider (single system + user turn).</summary>
public record AiChatRequest(string SystemPrompt, string UserPrompt, string Model, int MaxTokens);

public abstract record AiStreamEvent;

/// <summary>Incremental text chunk from the model.</summary>
public record AiTextDelta(string Text) : AiStreamEvent;

/// <summary>
/// Token usage report. Providers emit it at different points (Anthropic splits
/// input/output across events, OpenAI/Gemini report on the final chunk) — consumers
/// keep the maximum of each counter seen.
/// </summary>
public record AiUsageEvent(int InputTokens, int OutputTokens) : AiStreamEvent;

/// <summary>A web page the model consulted via the provider's server-side search tool.</summary>
public record AiWebSource(string Url, string? Title);

public record AiChatResult(string Text, int InputTokens, int OutputTokens, IReadOnlyList<AiWebSource>? Sources = null);

public record AiKeyCheckResult(bool Ok, string? Message);

/// <summary>
/// Uniform wrapper over one AI provider's wire protocol. Implementations are
/// constructed per request (BYOK — the key comes from the resolved credential) via
/// <see cref="IAiClientFactory"/>, and speak raw HTTP through IHttpClientFactory so
/// integration tests can stub them.
/// Revisit note: if tool-use grounding is ever adopted more broadly, evaluate
/// Microsoft.Extensions.AI as the unifying abstraction instead of growing this interface.
/// </summary>
public interface IAiChatClient
{
    IAsyncEnumerable<AiStreamEvent> StreamAsync(AiChatRequest request, CancellationToken cancellationToken);
    Task<AiChatResult> CompleteAsync(AiChatRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Single-turn completion with the provider's server-side web search tool enabled, so
    /// the model grounds its answer in real, currently published pages instead of relying
    /// on parametric knowledge. Non-streaming — search adds unpredictable latency.
    /// </summary>
    Task<AiChatResult> CompleteWithWebSearchAsync(AiChatRequest request, CancellationToken cancellationToken);

    /// <summary>Cheap key check (models listing — zero token cost).</summary>
    Task<AiKeyCheckResult> ValidateKeyAsync(CancellationToken cancellationToken);
}
