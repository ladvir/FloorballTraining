using System.Net;

namespace FloorballTraining.API.Services.Ai;

/// <summary>
/// Failure reported by an AI provider (auth, quota, availability, malformed reply).
/// Carries a short machine-readable code that ends up in AiUsageLog.ErrorType.
/// </summary>
public class AiProviderException(string errorType, string message, HttpStatusCode? statusCode = null)
    : Exception(message)
{
    public string ErrorType { get; } = errorType;
    public HttpStatusCode? StatusCode { get; } = statusCode;

    public static AiProviderException FromStatusCode(HttpStatusCode statusCode, string body)
    {
        var errorType = statusCode switch
        {
            HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => "InvalidKey",
            HttpStatusCode.TooManyRequests => "QuotaExceeded",
            >= HttpStatusCode.InternalServerError => "ProviderUnavailable",
            _ => "ProviderError"
        };
        // Body snippet only — provider error bodies are safe (no prompt content),
        // but keep them bounded for logs. 800 chars is enough to include e.g. the
        // exact Gemini quota metric that explains a 429.
        var snippet = body.Length > 800 ? body[..800] : body;
        return new AiProviderException(errorType, $"AI provider returned {(int)statusCode}: {snippet}", statusCode);
    }
}
