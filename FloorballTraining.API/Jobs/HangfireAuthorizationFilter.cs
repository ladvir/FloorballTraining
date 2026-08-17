using Hangfire.Dashboard;
using Microsoft.Extensions.DependencyInjection;

namespace FloorballTraining.API.Jobs;

/// <summary>
/// Grants access to the Hangfire dashboard to users with the "Admin" Identity role.
///
/// Two paths are supported:
/// 1. <b>JWT bearer header</b> — used by API clients (Swagger, curl, Postman).
///    The authentication middleware already ran, so <c>HttpContext.User</c> is populated.
/// 2. <b><see cref="HangfireAdminCookie.Name"/> cookie</b> — used by browser navigation.
///    JWT access tokens live in JS memory and are never sent with a plain page navigation;
///    the signed cookie is set at login (for Admin users) and cleared at logout.
/// </summary>
public sealed class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Path 1: JWT bearer (already validated by authentication middleware)
        if (httpContext.User.Identity?.IsAuthenticated == true
            && httpContext.User.IsInRole("Admin"))
            return true;

        // Path 2: Signed admin cookie (browser navigation)
        if (!httpContext.Request.Cookies.TryGetValue(HangfireAdminCookie.Name, out var cookie)
            || string.IsNullOrEmpty(cookie))
            return false;

        var secretKey = httpContext.RequestServices
            .GetRequiredService<IConfiguration>()["JwtSettings:SecretKey"];
        if (string.IsNullOrEmpty(secretKey)) return false;
        return HangfireAdminCookie.Validate(cookie, secretKey);
    }
}
