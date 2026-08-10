using System.Net;
using System.Text.Json;
using FloorballTraining.Plugins.EFCoreSqlServer;
using Hangfire;
using Lib.Net.Http.WebPush;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.API.Services
{
    public class VapidSettings
    {
        public string PublicKey { get; set; } = string.Empty;
        public string PrivateKey { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
    }

    public interface IWebPushService
    {
        /// <summary>Queues one Hangfire job per subscription; Hangfire retries transient failures.</summary>
        Task EnqueuePushToUserAsync(string userId, string title, string message);

        /// <summary>Hangfire job body — public so the job runner can invoke it via DI.</summary>
        Task SendToSubscriptionAsync(int subscriptionId, string title, string message);
    }

    public class WebPushService(
        FloorballTrainingContext context,
        PushServiceClient pushClient,
        IBackgroundJobClient backgroundJobs) : IWebPushService
    {
        public async Task EnqueuePushToUserAsync(string userId, string title, string message)
        {
            var subscriptionIds = await context.PushSubscriptions
                .Where(s => s.UserId == userId)
                .Select(s => s.Id)
                .ToListAsync();

            foreach (var id in subscriptionIds)
                backgroundJobs.Enqueue<IWebPushService>(s => s.SendToSubscriptionAsync(id, title, message));
        }

        public async Task SendToSubscriptionAsync(int subscriptionId, string title, string message)
        {
            var subscription = await context.PushSubscriptions.FindAsync(subscriptionId);
            if (subscription == null) return; // unsubscribed since the job was queued

            var payload = JsonSerializer.Serialize(new { title, message });

            var pushSubscription = new Lib.Net.Http.WebPush.PushSubscription { Endpoint = subscription.Endpoint };
            pushSubscription.SetKey(PushEncryptionKeyName.P256DH, subscription.P256dh);
            pushSubscription.SetKey(PushEncryptionKeyName.Auth, subscription.Auth);

            try
            {
                await pushClient.RequestPushMessageDeliveryAsync(pushSubscription, new PushMessage(payload));
            }
            catch (PushServiceClientException ex) when (
                ex.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                // Browser/OS dropped this subscription (uninstalled, expired) — stop sending to it.
                context.PushSubscriptions.Remove(subscription);
                await context.SaveChangesAsync();
            }
            // Any other exception propagates so Hangfire's default automatic retry re-attempts delivery.
        }
    }
}
