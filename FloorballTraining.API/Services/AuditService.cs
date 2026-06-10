using System.Security.Claims;
using System.Text.Json;
using FloorballTraining.Plugins.EFCoreSqlServer;
using FloorballTraining.Plugins.EFCoreSqlServer.Models;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services;

public class AuditService(
    IDbContextFactory<FloorballTrainingContext> contextFactory,
    IHttpContextAccessor httpContextAccessor,
    ILogger<AuditService> logger) : IAuditService
{
    public async Task LogAsync(
        string action,
        string? entityType = null,
        string? entityId = null,
        object? details = null,
        string? userId = null,
        string? userEmail = null)
    {
        try
        {
            var http = httpContextAccessor.HttpContext;

            var entry = new AuditLog
            {
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details is null ? null : JsonSerializer.Serialize(details),
                UserId = userId ?? http?.User.FindFirstValue(ClaimTypes.NameIdentifier),
                UserEmail = userEmail ?? http?.User.FindFirstValue(ClaimTypes.Email),
                IpAddress = http?.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Truncate(http?.Request.Headers.UserAgent.ToString(), 512),
                OccurredAt = DateTime.UtcNow
            };

            // Isolated short-lived context so an audit write never interferes with
            // (or gets rolled back by) the operation that triggered it.
            await using var ctx = await contextFactory.CreateDbContextAsync();
            ctx.AuditLogs.Add(entry);
            await ctx.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to write audit log for action {Action}", action);
        }
    }

    private static string? Truncate(string? value, int maxLength) =>
        string.IsNullOrEmpty(value) || value.Length <= maxLength ? value : value[..maxLength];
}
