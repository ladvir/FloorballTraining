namespace FloorballTraining.API.Dtos.Users
{
    public class UserClubMembershipInfo
    {
        public int ClubId { get; set; }
        public string ClubName { get; set; } = string.Empty;
        public int MemberId { get; set; }
        public string EffectiveRole { get; set; } = "User";

        // Member-specific data, so the user editor can manage the person's roster fields per club.
        public int BirthYear { get; set; }
        public int? Gender { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UserDto
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public IList<string> Roles { get; set; } = [];
        public string EffectiveRole { get; set; } = "User";
        public string? ClubName { get; set; }
        public int? ClubId { get; set; }
        public int? MemberId { get; set; }
        public List<UserClubMembershipInfo> ClubMemberships { get; set; } = [];
        public DateTime? LastLoginAt { get; set; }
        public string? PreferredLanguage { get; set; }
    }

    public class SetPasswordRequest
    {
        public required string NewPassword { get; set; }
    }

    public class RecentLoginDto
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime LastLoginAt { get; set; }
    }
}
