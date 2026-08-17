using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace FloorballTraining.API.Extensions;

public static class RateLimitingExtensions
{
    public const string LoginPolicy = "auth-login";
    public const string ForgotPasswordPolicy = "auth-forgot-password";
    public const string RegisterPolicy = "auth-register";
    public const string PublicPolicy = "public-endpoint";
    public const string AiPolicy = "ai";

    public static IServiceCollection AddAuthRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            AddIpFixedWindow(options, configuration, LoginPolicy, "RateLimiting:Login", defaultLimit: 5, defaultWindowMinutes: 15);
            AddIpFixedWindow(options, configuration, ForgotPasswordPolicy, "RateLimiting:ForgotPassword", defaultLimit: 3, defaultWindowMinutes: 60);
            AddIpFixedWindow(options, configuration, RegisterPolicy, "RateLimiting:Register", defaultLimit: 3, defaultWindowMinutes: 60);
            AddIpFixedWindow(options, configuration, PublicPolicy, "RateLimiting:Public", defaultLimit: 60, defaultWindowMinutes: 1);

            // AI calls are per-user (not per-IP): they burn the resolved credential's
            // provider quota, so one user must not exhaust a shared club/global key.
            AddUserFixedWindow(options, configuration, AiPolicy, "RateLimiting:Ai", defaultLimit: 10, defaultWindowMinutes: 1);

            options.OnRejected = (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)retryAfter.TotalSeconds).ToString(NumberFormatInfo.InvariantInfo);
                }

                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("RateLimiting");
                logger.LogWarning("Rate limit exceeded on {Path} from {Ip}",
                    context.HttpContext.Request.Path,
                    context.HttpContext.Connection.RemoteIpAddress?.ToString());

                return ValueTask.CompletedTask;
            };
        });

        return services;
    }

    private static void AddUserFixedWindow(
        RateLimiterOptions options,
        IConfiguration configuration,
        string policyName,
        string configSection,
        int defaultLimit,
        int defaultWindowMinutes)
    {
        var permitLimit = configuration.GetValue<int?>($"{configSection}:PermitLimit") ?? defaultLimit;
        var windowMinutes = configuration.GetValue<int?>($"{configSection}:WindowMinutes") ?? defaultWindowMinutes;

        options.AddPolicy(policyName, httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? httpContext.Connection.RemoteIpAddress?.ToString()
                              ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromMinutes(windowMinutes),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                }));
    }

    private static void AddIpFixedWindow(
        RateLimiterOptions options,
        IConfiguration configuration,
        string policyName,
        string configSection,
        int defaultLimit,
        int defaultWindowMinutes)
    {
        var permitLimit = configuration.GetValue<int?>($"{configSection}:PermitLimit") ?? defaultLimit;
        var windowMinutes = configuration.GetValue<int?>($"{configSection}:WindowMinutes") ?? defaultWindowMinutes;

        options.AddPolicy(policyName, httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromMinutes(windowMinutes),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                }));
    }
}
