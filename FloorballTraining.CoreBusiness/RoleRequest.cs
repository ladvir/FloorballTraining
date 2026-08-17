namespace FloorballTraining.CoreBusiness
{
    public enum RoleRequestStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public class RoleRequest : BaseEntity
    {
        public int MemberId { get; set; }
        public Member? Member { get; set; }

        public string RequestedRole { get; set; } = string.Empty;

        public RoleRequestStatus Status { get; set; } = RoleRequestStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ResolvedAt { get; set; }

        public string? ResolvedByUserId { get; set; }
    }
}
