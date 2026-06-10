namespace FloorballTraining.API.Dtos.Auth
{
    public class RegisterRequest
    {
        public required string Email { get; set; }

        public required string Password { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public int? ClubId { get; set; }

        public string? RequestedRole { get; set; }
    }
}
