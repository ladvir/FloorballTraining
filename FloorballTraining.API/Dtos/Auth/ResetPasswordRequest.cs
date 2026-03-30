using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.API.Dtos.Auth
{
    public class ResetPasswordRequest
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        public required string Token { get; set; }

        [Required]
        [MinLength(6)]
        public required string NewPassword { get; set; }
    }
}
