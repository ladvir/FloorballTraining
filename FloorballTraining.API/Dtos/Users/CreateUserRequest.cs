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
    }
}
