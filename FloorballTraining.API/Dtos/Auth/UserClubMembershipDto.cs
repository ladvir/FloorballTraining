namespace FloorballTraining.API.Dtos.Auth
{
    public class UserClubMembershipDto
    {
        public int ClubId { get; set; }
        public string ClubName { get; set; } = string.Empty;
        public int MemberId { get; set; }
        public string EffectiveRole { get; set; } = "User";
        public List<int> CoachTeamIds { get; set; } = [];
        /// <summary>True when this member has a player role in ≥1 team — gates XP/gamification visibility (#104).</summary>
        public bool IsPlayer { get; set; }
    }
}
