namespace FloorballTraining.Plugins.EFCoreSqlServer.Models
{
    /// <summary>An Expo push token for one FlotrPlayer install of a user (mobile counterpart of
    /// <see cref="PushSubscription"/>, which is browser Web Push).</summary>
    public class ExpoPushToken
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        public AppUser? User { get; set; }

        /// <summary>"ExponentPushToken[…]" — unique per device install.</summary>
        public string Token { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
