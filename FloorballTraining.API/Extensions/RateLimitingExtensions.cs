using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace FloorballTraining.API.Extensions;

public static class RateLimitingExtensions
{
    public const string LoginPolicy = "auth-login";
    public const string ForgotPasswordPolicy = "auth-forgot-password";
    public const string RegisterPolicy = "auth-register";

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
