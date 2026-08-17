using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.API.Services.Ai;

public interface IAiClientFactory
{
    IAiChatClient Create(AiProvider provider, string apiKey);
}

/// <summary>
/// Builds a per-request provider client. Uses the default IHttpClientFactory client
/// on purpose — integration tests replace that factory with canned HTTP stubs.
/// </summary>
public class AiClientFactory(IHttpClientFactory httpClientFactory) : IAiClientFactory
{
    public IAiChatClient Create(AiProvider provider, string apiKey) => provider switch
    {
        AiProvider.Anthropic => new AnthropicChatClient(httpClientFactory.CreateClient(), apiKey),
        AiProvider.OpenAi => new OpenAiChatClient(httpClientFactory.CreateClient(), apiKey),
        AiProvider.Gemini => new GeminiChatClient(httpClientFactory.CreateClient(), apiKey),
        _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, "Unknown AI provider")
    };
}
