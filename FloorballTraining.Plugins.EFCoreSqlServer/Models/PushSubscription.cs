namespace FloorballTraining.Plugins.EFCoreSqlServer.Models
{
    /// <summary>A browser's Web Push subscription (one per device/browser) for a user.</summary>
    public class PushSubscription
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        public AppUser? User { get; set; }

        public string Endpoint { get; set; } = string.Empty;
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
