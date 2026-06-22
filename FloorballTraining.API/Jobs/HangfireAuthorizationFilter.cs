using Hangfire.Dashboard;
using System.Net;

namespace FloorballTraining.API.Jobs;

/// <summary>
/// Restricts the Hangfire dashboard to requests originating from the local machine.
///
/// JWT access tokens are stored in JavaScript memory and are never sent automatically
/// with browser navigation, so role-based checks via HttpContext.User are not usable here.
/// Restrict to localhost; use an SSH tunnel or network-level auth for remote admin access.
/// </summary>
public sealed class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var connection = context.GetHttpContext().Connection;
        return connection.RemoteIpAddress is { } remote
               && (remote.Equals(connection.LocalIpAddress)
                   || IPAddress.IsLoopback(remote));
    }
}
