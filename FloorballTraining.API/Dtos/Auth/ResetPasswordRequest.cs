namespace FloorballTraining.API.Dtos.Auth
{
    public class ResetPasswordRequest
    {
        public required string Email { get; set; }

        public required string Token { get; set; }

        public required string NewPassword { get; set; }
    }
}
