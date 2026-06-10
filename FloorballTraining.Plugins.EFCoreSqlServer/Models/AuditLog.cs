namespace FloorballTraining.Plugins.EFCoreSqlServer.Models
{
    public class AuditLog
    {
        public long Id { get; set; }

        /// <summary>Acting user's Identity id (null for anonymous actions such as a failed login).</summary>
        public string? UserId { get; set; }
        public string? UserEmail { get; set; }

        /// <summary>What happened, e.g. "Login.Success", "Role.Changed", "Training.Deleted".</summary>
        public string Action { get; set; } = string.Empty;

        /// <summary>Affected entity type, e.g. "Training", "Member".</summary>
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }

        /// <summary>Optional structured context, serialized as JSON.</summary>
        public string? Details { get; set; }

        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        public DateTime OccurredAt { get; set; }
    }
}
