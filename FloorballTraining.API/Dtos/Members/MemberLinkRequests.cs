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
}
