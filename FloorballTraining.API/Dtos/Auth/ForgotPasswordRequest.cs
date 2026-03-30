using System.ComponentModel.DataAnnotations;

namespace FloorballTraining.API.Dtos.Auth
{
    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
    }
}
