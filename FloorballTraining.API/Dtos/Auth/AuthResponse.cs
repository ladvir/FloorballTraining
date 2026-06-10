namespace FloorballTraining.API.Dtos.Auth
{
    public class AuthResponse
    {
        public required string Id { get; set; }

        /// <summary>Legacy alias for <see cref="AccessToken"/>; kept until FloTr migrates (F10/S2).</summary>
        public required string Token { get; set; }

        public required string AccessToken { get; set; }
        public string? RefreshToken { get; set; }

        public required string Email { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public IList<string> Roles { get; set; } = [];
        public int? DefaultClubId { get; set; }
        public int? DefaultTeamId { get; set; }
        public string EffectiveRole { get; set; } = "User";
        public int? ClubId { get; set; }
        public List<int> CoachTeamIds { get; set; } = [];
        public List<UserClubMembershipDto> ClubMemberships { get; set; } = [];
    }
}
