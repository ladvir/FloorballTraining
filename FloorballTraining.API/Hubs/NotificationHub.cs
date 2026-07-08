using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FloorballTraining.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    // Server-to-client only; no client-callable methods needed yet.
    // Clients receive: "notification", "appointment.changed", "rating.created", "lineup.shared"
}
