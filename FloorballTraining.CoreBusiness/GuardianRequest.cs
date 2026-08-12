namespace FloorballTraining.CoreBusiness
{
    public enum GuardianRequestStatus
    {
        Pending,
        Approved,
        Rejected
    }

    /// <summary>
    /// A parent's self-service request to link with a child member (identified via the child's
    /// invite code), approved or rejected by a coach. Approval creates a <see cref="MemberGuardian"/>
    /// link. Distinct from <see cref="RoleRequest"/>, which requests a club role for a member.
    /// </summary>
    public class GuardianRequest : BaseEntity
    {
        public int MemberId { get; set; }
        public Member? Member { get; set; }

        public string GuardianAppUserId { get; set; } = string.Empty;

        public GuardianRequestStatus Status { get; set; } = GuardianRequestStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ResolvedAt { get; set; }

        public string? ResolvedByUserId { get; set; }
    }
}
