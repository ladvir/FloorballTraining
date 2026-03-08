namespace FloorballTraining.API.Dtos.Auth
{
    public class AuthResponse
    {
        public required string Token { get; set; }
        public required string Email { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public IList<string> Roles { get; set; } = [];
        public int? DefaultClubId { get; set; }
        public int? DefaultTeamId { get; set; }
    }
}
