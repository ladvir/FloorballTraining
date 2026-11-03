using System.Security.Claims;
using FloorballTraining.API.Services;
using FloorballTraining.Plugins.EFCoreSqlServer;

namespace FloorballTraining.API.Middlewares;

/// <summary>Guest accounts are strictly read-only (incl. profile and password): any write → 403
/// (except logout and the receive-only notification hub).</summary>
public class GuestReadOnlyMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext http, FloorballTrainingContext db)
    {
        var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null && !http.Request.Path.StartsWithSegments("/auth/logout")
            // SignalR negotiate is a POST but only opens the receive-only notification stream (the hub has no client-callable methods).
            && !http.Request.Path.StartsWithSegments("/hubs/notifications") && !HttpMethods.IsGet(http.Request.Method) && !HttpMethods.IsHead(http.Request.Method)
            && !HttpMethods.IsOptions(http.Request.Method) && await db.IsGuestAsync(userId))
        {
            http.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }
        await next(http);
    }
}
