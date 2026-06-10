namespace FloorballTraining.API.Services;

public interface IAuditService
{
    /// <summary>
    /// Records a sensitive action. Resilient: never throws — an audit failure
    /// must not break the operation being audited. The acting user and request
    /// metadata (IP, user agent) are taken from the current HttpContext unless
    /// overridden (e.g. failed login, where there is no authenticated user).
    /// </summary>
    Task LogAsync(
        string action,
        string? entityType = null,
        string? entityId = null,
        object? details = null,
        string? userId = null,
        string? userEmail = null);
}
