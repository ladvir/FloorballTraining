namespace FloorballTraining.API.Dtos.Auth
{
    public class UserClubMembershipDto
    {
        public int ClubId { get; set; }
        public string ClubName { get; set; } = string.Empty;
        public int MemberId { get; set; }
        public string EffectiveRole { get; set; } = "User";
        public List<int> CoachTeamIds { get; set; } = [];
    }
}
