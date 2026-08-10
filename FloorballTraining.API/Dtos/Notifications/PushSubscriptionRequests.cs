namespace FloorballTraining.API.Dtos.Notifications
{
    /// <summary>Browser Web Push subscription payload (from PushSubscription.toJSON()).</summary>
    public class PushSubscribeRequest
    {
        public required string Endpoint { get; set; }
        public required string P256dh { get; set; }
        public required string Auth { get; set; }
    }

    public class PushUnsubscribeRequest
    {
        public required string Endpoint { get; set; }
    }
}
