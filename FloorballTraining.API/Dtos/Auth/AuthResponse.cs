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
        public string? PreferredLanguage { get; set; }
        public string EffectiveRole { get; set; } = "User";
        /// <summary>"Player" (EffectiveRole "User"), "Coach" (any club role), or "Guardian" (a plain user linked to children, #102) — routes the mobile app.</summary>
        public string AccountType { get; set; } = "Player";
        /// <summary>True when this login is a guardian of ≥1 child. Independent of AccountType, so a coach
        /// who is also a parent still gets a "Moje děti" entry (#102).</summary>
        public bool HasGuardianChildren { get; set; }
        public int? ClubId { get; set; }
        public List<int> CoachTeamIds { get; set; } = [];
        public List<UserClubMembershipDto> ClubMemberships { get; set; } = [];
    }
}
