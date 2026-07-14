using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.API.Dtos.Users
{
    public class CreateUserRequest
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        [MinLength(6)]
        public required string Password { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public int? ClubId { get; set; }

        /// <summary>
        /// Desired role: Admin, HeadCoach, Coach, or User
        /// </summary>
        public string Role { get; set; } = "User";

        /// <summary>
        /// When true, send a welcome email with the credentials and instructions on changing the password.
        /// </summary>
        public bool SendCredentialsEmail { get; set; }

        // Member-specific data written to the auto-created Member row.
        public int BirthYear { get; set; }
        public int? Gender { get; set; }

        /// <summary>Preferred UI language (e.g. "cs", "en"); applied on the user's next login.</summary>
        public string? PreferredLanguage { get; set; }
    }

    /// <summary>Admin/ClubAdmin update of another user's profile (name, email, language).</summary>
    public class UpdateUserProfileRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PreferredLanguage { get; set; }
    }

    /// <summary>Link a user to an existing (unlinked) member by member id.</summary>
    public class LinkMemberRequest
    {
        public int MemberId { get; set; }
    }
}
