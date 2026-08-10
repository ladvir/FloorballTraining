using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.CoreBusiness
{
    /// <summary>
    /// Links a guardian (parent) login account to a child member. Many-to-many:
    /// a guardian can have several children, a child several guardians. Distinct
    /// from <see cref="Member.AppUserId"/>, which is the member's own login.
    /// </summary>
    public class MemberGuardian : BaseEntity
    {
        public int MemberId { get; set; }
        public Member? Member { get; set; }

        public string GuardianAppUserId { get; set; } = string.Empty;

        /// <summary>Optional relationship to the child (parent/grandparent/other); unset when not needed.</summary>
        public GuardianRelationship? Relationship { get; set; }

        public string? CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
