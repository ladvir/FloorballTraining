using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.API.Dtos.Members
{
    /// <summary>Link a member to an existing login account (AppUser) by id.</summary>
    public class LinkUserRequest
    {
        public required string UserId { get; set; }
    }

    /// <summary>Create a login account from a member's data and link it.</summary>
    public class CreateLoginRequest
    {
        /// <summary>Optional explicit password; when empty a temporary one is generated.</summary>
        public string? Password { get; set; }

        /// <summary>When true, email the credentials to the member.</summary>
        public bool SendCredentials { get; set; }

        /// <summary>Preferred UI language for the new account (e.g. "cs", "en").</summary>
        public string? Language { get; set; }
    }

    /// <summary>Update a member's roster fields (used when managing a person's member data).</summary>
    public class UpdateRosterRequest
    {
        public int BirthYear { get; set; }
        public int? Gender { get; set; }
        public bool IsActive { get; set; } = true;
    }

    /// <summary>A user that can be linked to a member (candidate for the link picker).</summary>
    public class LinkCandidateDto
    {
        public required string UserId { get; set; }
        public required string Email { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }

    /// <summary>Invite/link a guardian (parent) to a child member by e-mail.</summary>
    public class AddGuardianRequest
    {
        public required string Email { get; set; }

        /// <summary>When true, email the credentials to a newly created guardian account.</summary>
        public bool SendCredentials { get; set; }

        /// <summary>Preferred UI language for a newly created guardian account (e.g. "cs", "en").</summary>
        public string? Language { get; set; }

        /// <summary>Optional relationship to the child (<see cref="GuardianRelationship"/> value).</summary>
        public GuardianRelationship? Relationship { get; set; }
    }

    /// <summary>A guardian linked to a child member.</summary>
    public class GuardianDto
    {
        public int LinkId { get; set; }
        public required string GuardianAppUserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public GuardianRelationship? Relationship { get; set; }
    }

    /// <summary>Parent self-service: identify the child by the coach-issued invite code and file a request (#113).</summary>
    public class CreateGuardianRequestRequest
    {
        public required string Email { get; set; }
        public required string Code { get; set; }

        /// <summary>Preferred UI language for a newly created guardian account (e.g. "cs", "en").</summary>
        public string? Language { get; set; }
    }

    /// <summary>A pending parent self-service request, for the coach approval screen.</summary>
    public class GuardianRequestDto
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public string ChildName { get; set; } = string.Empty;
        public string ClubName { get; set; } = string.Empty;
        public string GuardianEmail { get; set; } = string.Empty;
        public string GuardianName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>A child a guardian is linked to (guardian's own read-only view).</summary>
    public class GuardianChildDto
    {
        public int MemberId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int BirthYear { get; set; }
        public string ClubName { get; set; } = string.Empty;
        public int TotalXp { get; set; }
        public int Level { get; set; }
        public string Rank { get; set; } = string.Empty;

        /// <summary>The child's seasonal placement in their club (1-based); null when they have no ranking yet.</summary>
        public int? ClubRank { get; set; }

        /// <summary>How many players the club ranking has — the denominator for "5. z 20".</summary>
        public int ClubSize { get; set; }
    }
}
