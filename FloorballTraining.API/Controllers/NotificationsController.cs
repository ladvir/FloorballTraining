using System.Security.Claims;
using FloorballTraining.API.Dtos.Notifications;
using FloorballTraining.API.Services;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace FloorballTraining.API.Controllers
{
    [Authorize]
    public class NotificationsController(
        INotificationService notificationService,
        FloorballTrainingContext context,
        VapidSettings vapidSettings) : BaseApiController
    {
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var notifications = await notificationService.GetForUserAsync(userId);
            return Ok(notifications);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var count = await notificationService.GetUnreadCountAsync(userId);
            return Ok(new { count });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            await notificationService.MarkAsReadAsync(id, userId);
            return NoContent();
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            await notificationService.MarkAllAsReadAsync(userId);
            return NoContent();
        }

        [HttpGet("vapid-public-key")]
        [AllowAnonymous]
        public IActionResult GetVapidPublicKey() => Ok(new { publicKey = vapidSettings.PublicKey });

        [HttpPost("push-subscribe")]
        public async Task<IActionResult> PushSubscribe(PushSubscribeRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var existing = await context.PushSubscriptions
                .FirstOrDefaultAsync(s => s.Endpoint == request.Endpoint);

            if (existing != null)
            {
                existing.UserId = userId;
                existing.P256dh = request.P256dh;
                existing.Auth = request.Auth;
            }
            else
            {
                context.PushSubscriptions.Add(new Plugins.EFCoreSqlServer.Models.PushSubscription
                {
                    UserId = userId,
                    Endpoint = request.Endpoint,
                    P256dh = request.P256dh,
                    Auth = request.Auth,
                });
            }

            await context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("push-unsubscribe")]
        public async Task<IActionResult> PushUnsubscribe(PushUnsubscribeRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            await context.PushSubscriptions
                .Where(s => s.Endpoint == request.Endpoint && s.UserId == userId)
                .ExecuteDeleteAsync();

            return NoContent();
        }

        /// <summary>
        /// Development-only: creates a notification for the current user and pushes it via SignalR.
        /// Used by E2E tests to verify real-time notification delivery without side effects.
        /// Returns 404 in Production.
        /// </summary>
        [HttpPost("ping")]
        public async Task<IActionResult> TestPing([FromServices] IHostEnvironment env)
        {
            if (!env.IsDevelopment()) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            await notificationService.CreateForUserAsync(
                userId, "E2eTest", "Test notifikace", "E2E ověření SignalR doručení");

            return NoContent();
        }
    }
}
