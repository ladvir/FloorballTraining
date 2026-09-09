using System.Net.Http.Json;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services
{
    /// <summary>
    /// Mobile push for FlotrPlayer via Expo's push service (https://exp.host). Mirrors
    /// <see cref="IWebPushService"/>: one Hangfire job per registered device token, so a transient
    /// failure retries in the background off the originating request.
    /// </summary>
    public interface IExpoPushService
    {
        Task EnqueuePushToUserAsync(string userId, string title, string message);

        /// <summary>Hangfire job body — public so the job runner can invoke it via DI.</summary>
        Task SendToTokenAsync(int tokenId, string title, string message);
    }

    public class ExpoPushService(
        FloorballTrainingContext context,
        IHttpClientFactory httpClientFactory,
        IBackgroundJobClient backgroundJobs,
        ILogger<ExpoPushService> logger) : IExpoPushService
    {
        private const string ExpoPushUrl = "https://exp.host/--/api/v2/push/send";

        public async Task EnqueuePushToUserAsync(string userId, string title, string message)
        {
            var tokenIds = await context.ExpoPushTokens
                .Where(t => t.UserId == userId)
                .Select(t => t.Id)
                .ToListAsync();

            foreach (var id in tokenIds)
                backgroundJobs.Enqueue<IExpoPushService>(s => s.SendToTokenAsync(id, title, message));
        }

        public async Task SendToTokenAsync(int tokenId, string title, string message)
        {
            var row = await context.ExpoPushTokens.FindAsync(tokenId);
            if (row == null) return; // unregistered since the job was queued

            var client = httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync(ExpoPushUrl, new[]
            {
                new { to = row.Token, title, body = message, sound = "default" }
            });
            var body = await response.Content.ReadAsStringAsync();

            // Expo returns HTTP 200 with a per-ticket {"status":"error","details":{"error":"DeviceNotRegistered"}}
            // once the OS drops the token (app uninstalled / notifications disabled) — stop sending to it.
            if (body.Contains("DeviceNotRegistered", StringComparison.OrdinalIgnoreCase))
            {
                context.ExpoPushTokens.Remove(row);
                await context.SaveChangesAsync();
                return;
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Expo push to token {TokenId} failed: {Status} {Body}",
                    tokenId, (int)response.StatusCode, body);
                response.EnsureSuccessStatusCode(); // propagate so Hangfire's default retry re-attempts
            }
        }
    }
}
