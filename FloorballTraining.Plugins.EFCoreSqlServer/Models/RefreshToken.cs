namespace FloorballTraining.Plugins.EFCoreSqlServer.Models
{
    public class RefreshToken
    {
        public int Id { get; set; }

        public string AppUserId { get; set; } = string.Empty;
        public AppUser? AppUser { get; set; }

        /// <summary>SHA-256 hash of the raw refresh token. The raw value is never persisted.</summary>
        public string TokenHash { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedByIp { get; set; }

        public DateTime? RevokedAt { get; set; }
        public string? RevokedByIp { get; set; }

        /// <summary>Hash of the token that replaced this one during rotation (audit chain).</summary>
        public string? ReplacedByTokenHash { get; set; }

        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
        public bool IsRevoked => RevokedAt != null;
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}
