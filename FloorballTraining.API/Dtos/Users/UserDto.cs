namespace FloorballTraining.API.Dtos.Users
{
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
    }
}
